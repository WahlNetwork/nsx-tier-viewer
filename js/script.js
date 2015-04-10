function initialize(){
	objectTypeArray=['edge','transit','router','switch'];
	edgeArray=[];
	transitArray=[];
	routerArray=[];
	switchArray=[];
	linkArray=[];
	getObjects();
	for(var o=0;o<objectTypeArray.length;o++){ //for each type of object which can be drawn...
		if(this[objectTypeArray[o]+'Array']){ //if the array has objects in it...
			drawObjects(objectTypeArray[o]); //draw the objects
		};
	};
	getLinks();
	drawLinks();
};
function getObjects(){ //funtion to gather object information from the xml files and store the data as javascript objects
	var edgeXML=getXML('data/xml/edges.xml'); //get the XML for the edges
	if(edgeXML.getElementsByTagName('totalCount')[0].textContent>0){ //if there are any 'edges' defined in edges.xml
		var edges=edgeXML.getElementsByTagName('edgeSummary'); //get all 'edges' defined in edges.xml
		for(var e=0;e<edges.length;e++){ //for each 'edge' in edges.xml
			var newObject=eval('('+xml2json(edges[e],"")+')'); //create a newObject containing the edge variables from the xml
			if(newObject['edgeSummary']['edgeType']=='gatewayServices'){ //if it's actually an edge
				edgeArray.push(newObject); //add the newObject to the edgeArray
			}else if(newObject['edgeSummary']['edgeType']=='distributedRouter'){ //if it's actually a router
				var intXML=getXML('data/xml/'+newObject['edgeSummary']['objectId']+'int.xml'); //get the XML for the router interfaces
				interfaces=intXML.getElementsByTagName('interface'); //get all 'interfaces' defined in interfaces.xml
				for(var i=0;i<interfaces.length;i++){ //for each interface...
					newObject=mergeObjects(newObject,eval('('+xml2json(interfaces[i],"")+')')); //add the interface information to the newObject
				};
				routerArray.push(newObject); //add the newObject to the routerArray
			}else{ //not an edge or a router?
				alert('Edge "'+edges[i].getElementsByTagName('name')[0].textContent+'" is of an undefined edgeType ('+edges[i].getElementsByTagName('edgeType')[0].textContent+').');
			};
		};
	}else{
		alert('There are no edges or routers configured in this NSX instance.');
	};
	var switchXML=getXML('data/xml/virtualwires.xml'); //get the XML for the switches
	if(switchXML.getElementsByTagName('totalCount')[0].textContent>0){ //if there are any 'switches' defined in virtualwires.xml
		var switches=switchXML.getElementsByTagName('virtualWire'); //get all 'switches' defined in virtualwires.xml
		for(var s=0;s<switches.length;s++){ //for each switch in virtualwires.xml...
			var newObject=eval('('+xml2json(switches[s],"")+')'); //create a newObject containing the switch variables from the xml
			for(var r=0;r<routerArray.length;r++){ //for each router in the routerArray...
				for(var i=0;i<routerArray[r]['interface']['type'].length;i++){ //for each interface defined for the current router...
					if(newObject['virtualWire']['objectId']==routerArray[r]['interface']['connectedToId'][i]&&routerArray[r]['interface']['type'][i]=="uplink"){ //if it's a transit...
						transitArray.push(newObject); //add the newObject to the transitArray
					}else if(newObject['virtualWire']['objectId']==routerArray[r]['interface']['connectedToId'][i]&&routerArray[r]['interface']['type'][i]=="internal"){ //if it's a switch...
						switchArray.push(newObject); //add the newObject to the switchArray
					};
				};
			};
		};
	}else{ //if there are no 'switches' defined in virtualwires.xml
		alert('There are no switches configured in this NSX instance.');
	};
};
function getXML(path){
	var xmlRequest=new XMLHttpRequest();
	xmlRequest.open("GET",path,false);
	xmlRequest.send();
	return xmlRequest.responseXML;
};
function mergeObjects(object1,object2){
	var finalObject={};
	for(var each in object2){
		if(object1.hasOwnProperty(each)&&object2.hasOwnProperty(each)){
			if(typeof(object1[each])=="object"&&typeof(object2[each])=="object"){
				finalObject[each]=mergeObjects(object1[each],object2[each]);
			}else{
				finalObject[each]=[].concat.apply([],[object1[each],object2[each]]);
			};
		}else if(object2.hasOwnProperty(each)){
			finalObject[each]=object2[each];
		};
	};
	for(var each in object1){
		if(!(each in object2)&&object1.hasOwnProperty(each)){
			finalObject[each]=object1[each];
		};
	};
	return finalObject;
};
function drawObjects(type){
	for(var n=0;n<this[type+'Array'].length;n++){
		var newDiv=document.createElement('div');
		newDiv.id=type+n;
		newDiv.className=type+'Div';
		if(type=='edge'||type=='router'){
			newDiv.innerHTML='<label class="nodeLabel">'+this[type+'Array'][n]['edgeSummary']['name']+'</label>';
		}else{
			newDiv.innerHTML='<label class="nodeLabel">'+this[type+'Array'][n]['virtualWire']['name']+'</label>';
		};
		document.getElementById(type+'Container').appendChild(newDiv);
		var newTooltip=document.createElement('div');
		newTooltip.className=type+'Tooltip';
		for(var property in this[type+'Array'][n]){ //for every 'property' contained within the current object...
			if(property!='interface'){ //exclude the interface information added to routers
				for(var subProperty in this[type+'Array'][n][property]){ //grab every subProperty ...
					newTooltip.innerHTML+=subProperty+': '+this[type+'Array'][n][property][subProperty]+'<br/>'; //add the subProperty to the newTooltip
				};
			};
		};
		newDiv.appendChild(newTooltip);
		newDiv.addEventListener('mouseover',function(){
			this.getElementsByClassName(type+'Tooltip')[0].style.display='block';
		});
		newDiv.addEventListener('mouseout',function(){
			this.getElementsByClassName(type+'Tooltip')[0].style.display='none';
		});
	};
};
function getLinks(){ //funtion to gather link information and store the data as javascript objects in the linkArray
	for(var e=0;e<edgeArray.length;e++){ //for each edge in the edgeArray...
		for(var t=0;t<transitArray.length;t++){ //for each transit in the transitArray...
			addLink('edge'+e,'transit'+t); //add the link
		};
	};
	for(var r=0;r<routerArray.length;r++){ //for each router in the routerArray...
		for(var i=0;i<routerArray[r]['interface']['name'].length;i++){ //for each interface defined for the current router
			for(var t=0;t<transitArray.length;t++){ //for each transit in the transitArray...
				if(transitArray[t]['virtualWire']['objectId']==routerArray[r]['interface']['connectedToId'][i]&&routerArray[r]['interface']['isConnected'][i]=='true'){ //if the router is connected to the transit...
					addLink('router'+r,'transit'+t); //add the link
				};
			};
			for(var s=0;s<switchArray.length;s++){ //for each switch in the switchArray...
				if(switchArray[s]['virtualWire']['objectId']==routerArray[r]['interface']['connectedToId'][i]&&routerArray[r]['interface']['isConnected'][i]=='true'){ //if the router is connected to the switch...
					addLink('router'+r,'switch'+s); //add the link
				};
			};
		};
	};
};
function addLink(object1,object2){ //function to add a link to the linkArray
	if(linkArray.length==0){ //if there are no links in linkArray...
		linkArray.push(object1+','+object2); //add the link to the linkArray
	}else{ //if there is at least one link in the linkArray...
		var push=true; //set a temporary variable to determine whether or not the link should be added to the linkArray
		for(var l=0;l<linkArray.length;l++){ //for each link in the linkArray...
			if(linkArray[l]==object1+','+object2||linkArray[l]==object2+','+object1){ //if the link we're trying to add already exists in the linkArray...
				push=false; //set the 'push' variable to false to avoid re-adding the link the linkArray...
			};
		};
		if(push){linkArray.push(object1+','+object2);}; //if we didn't set the 'push' variable to false, add the new link the linkArray
	};
};
function drawLinks(){ //draw the links in the linkArray
	var linkDivs=document.getElementsByClassName('linkDiv'); //get any pre-existing drawn links
	while(linkDivs[0]){ //while there are any drwan links...
		linkDivs[0].parentNode.removeChild(linkDivs[0]); //delete the link so it can be redrawn
	}; //NOTE: the 3 lines above were added in case new objects/links are added and an update needs to be performed down the road
	console.log(linkArray);
	for(var l=0;l<linkArray.length;l++){
		var thickness=4;
		var linkObjects=linkArray[l].split(',');
		div1=document.getElementById(linkObjects[0]);
		div2=document.getElementById(linkObjects[1]);
		if(relativeOffsetTop(div1.id)==relativeOffsetTop(div2.id)){ //side-by-side divs
			if(relativeOffsetLeft(div1.id)<relativeOffsetLeft(div2.id)){ //div1 is left of div2
				var x1=relativeOffsetLeft(div1.id)+div1.offsetWidth;
				var y1=relativeOffsetTop(div1.id)+div1.offsetHeight/2;
				var x2=relativeOffsetLeft(div2.id);
				var y2=relativeOffsetTop(div2.id)+div2.offsetHeight/2;
			}else{ //div2 is left of div1
				var x1=relativeOffsetLeft(div2.id)+div2.offsetWidth;
				var y1=relativeOffsetTop(div2.id)+div2.offsetHeight/2;
				var x2=relativeOffsetLeft(div1.id);
				var y2=relativeOffsetTop(div1.id)+div1.offsetHeight/2;
			};
		}else{ //one div is higher than the other
			if(relativeOffsetTop(div1.id)<relativeOffsetTop(div2.id)){ //div1 is higher than div2
				var x1=relativeOffsetLeft(div1.id)+div1.offsetWidth/2;
				var y1=relativeOffsetTop(div1.id)+div1.offsetHeight;
				var x2=relativeOffsetLeft(div2.id)+div2.offsetWidth/2;
				var y2=relativeOffsetTop(div2.id);
			}else{ //div2 is higher than div1
				var x1=relativeOffsetLeft(div2.id)+div2.offsetWidth/2;
				var y1=relativeOffsetTop(div2.id)+div2.offsetHeight;
				var x2=relativeOffsetLeft(div1.id)+div1.offsetWidth/2;
				var y2=relativeOffsetTop(div1.id);
			};
		};
		var length=Math.sqrt(((x2-x1)*(x2-x1))+((y2-y1)*(y2-y1)));
		var centerX=((x1+x2)/2)-(length/2);
		var centerY=((y1+y2)/2)-(thickness/2);
		var angle=Math.atan2((y1-y2),(x1-x2))*(180/Math.PI);
		var newLink=document.createElement('div');
		newLink.id='link'+l;
		newLink.className='linkDiv';
		newLink.style.top=centerY+'px';
		newLink.style.left=centerX+'px';
		newLink.style.height=thickness+'px';
		newLink.style.width=length+'px';
		newLink.style.WebkitTransform='rotate('+angle+'deg)';
		newLink.style.msTransform='rotate('+angle+'deg)';
		newLink.style.transform='rotate('+angle+'deg)';
		document.getElementById('diagramDiv').appendChild(newLink);
		//var id=l;
		//newLink.addEventListener('click',function(){deleteLink(id);});
	};
};
function relativeOffsetTop(id){
	return document.getElementById(id).offsetTop+document.getElementById(id).parentNode.offsetTop
};
function relativeOffsetLeft(id){
	return document.getElementById(id).offsetLeft+document.getElementById(id).parentNode.offsetLeft
};
/*
function deleteLink(id){
	document.getElementById('link'+id).parentNode.removeChild(document.getElementById('link'+id));
	linkArray.splice(id,1);
	drawLinks();
};
function populateLinkSelects(){
	var linkOptions=document.getElementsByClassName('linkOption');
	while(linkOptions[0]){
		linkOptions[0].parentNode.removeChild(linkOptions[0]);
	};
	var linkSelect1=document.getElementById('linkSelect1');
	var linkSelect2=document.getElementById('linkSelect2');
	for(var o=0;o<objectTypeArray.length;o++){
		for(var l=1;l<=2;l++){
			for(var n=0;n<this[objectTypeArray[o]+'Array'].length;n++){
				var newOption=document.createElement('option');
				newOption.className='linkOption';
				newOption.innerHTML=this[objectTypeArray[o]+'Array'][n]['type']+n;
				newOption.value=this[objectTypeArray[o]+'Array'][n]['type']+n;
				this['linkSelect'+l].appendChild(newOption);
			};
		};
	};
};
*/
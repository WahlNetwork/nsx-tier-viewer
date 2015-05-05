function initialize(){
	objectArray=[];
	nodeArray=[];
	linkArray=[];
	getObjects();
	buildNodeArray();
	buildLinkArray();
	drawDiagram();
};
function getObjects(){ //function to gather object information from the xml files and store the data as javascript objects
	var edgeListXML=getXML('data/edges.xml'); //get the XML for the edges
	if(edgeListXML.getElementsByTagName('totalCount')[0].textContent>0){ //if there are any 'edges' defined in edges.xml
		for(var e=0;e<edgeListXML.getElementsByTagName('edgeSummary').length;e++){ //for each 'edge' in edges.xml
			var edgeXML=getXML('data/'+edgeListXML.getElementsByTagName('edgeSummary')[e].getElementsByTagName('objectId')[0].textContent+'.xml'); //get the XML for the current 'edge'
			var newObject=eval('('+xml2json(edgeXML,"")+')'); //create a newObject containing the edge variables from the xml
			objectArray.push(newObject); //add the newObject to the objectArray
		};
	}else{
		alert('There are no edges or routers configured in this NSX instance.');
	};
	var switchXML=getXML('data/virtualwires.xml'); //get the XML for the switches
	if(switchXML.getElementsByTagName('totalCount')[0].textContent>0){//if there are any 'switches' defined in virtualwires.xml
		var switches=switchXML.getElementsByTagName('virtualWire'); //get all 'switches' defined in virtualwires.xml
		for(var s=0;s<switches.length;s++){//for each switch in virtualwires.xml...
			var newObject=eval('('+xml2json(switches[s],"")+')'); //create a newObject containing the switch variables from the xml
			objectArray.push(newObject); //add the newObject to the objectArray
		};
	}else{ //if there are no 'switches' defined in virtualwires.xml
		alert('There are no switches configured in this NSX instance.');
	};
};
function getXML(path){
	var xmlRequest=new XMLHttpRequest();
	xmlRequest.open("GET",path,false);
	try{
		xmlRequest.send();
	}catch(err){
		alert('Error opening XML file: "'+path+'"\n'+'Did the ruby script fail?'+'\n'+'Please verify the credentials in "credentials.rb"');
	};
	return xmlRequest.responseXML;
};
function buildNodeArray(){//function to gather node information and store the data in the nodeArray
	for(var o=0;o<objectArray.length;o++){//for each object in the objectArray...
		var thisNode='';
		var id='';
		var name='';
		var shape='ellipse';
		var className='';
		if(objectArray[o].hasOwnProperty('edge')){ //if the current object is a router...
			id=objectArray[o]['edge']['id'];
			name=objectArray[o]['edge']['name'];
			if(objectArray[o]['edge']['type']=='gatewayServices'){ //if it's a gatewayServices object
				className='edge';
				for(var v=0;v<objectArray[o]['edge']['vnics']['vnic'].length;v++){
					if(objectArray[o]['edge']['vnics']['vnic'][v]['isConnected']=='true'){
						if(objectArray[o]['edge']['vnics']['vnic'][v]['portgroupId'].substring(0,12)=='dvportgroup-'){
							var alreadyExists=false;
							for(n=0;n<nodeArray.length;n++){
								if(nodeArray[n]['data']['id']==objectArray[o]['edge']['vnics']['vnic'][v]['portgroupId']){ //if the dvportgroup node already exists
									alreadyExists=true;
								};
							};
							if(alreadyExists==false){
								var portNode="{data:{id:'"+objectArray[o]['edge']['vnics']['vnic'][v]['portgroupId']+"',name:'"+objectArray[o]['edge']['vnics']['vnic'][v]['portgroupName']+"',faveShape:'square'},classes:'dvportgroup'}";
								nodeArray.push(eval("("+portNode+")"));
							};
						};
					};
				};
			}else if(objectArray[o]['edge']['type']=='distributedRouter'){ //if it's a distributedRouter object
				className='router';
				for(var i=0;i<objectArray[o]['edge']['interfaces']['interface'].length;i++){
					if(objectArray[o]['edge']['interfaces']['interface'][i]['isConnected']=='true'){
						if(objectArray[o]['edge']['interfaces']['interface'][i]['connectedToId'].substring(0,12)=='dvportgroup-'){
							var alreadyExists=false;
							for(n=0;n<nodeArray.length;n++){
								if(nodeArray[n]['data']['id']==objectArray[o]['edge']['interfaces']['interface'][i]['connectedToId']){ //if the dvportgroup node already exists
									alreadyExists=true;
								};
							};
							if(alreadyExists==false){
								var portNode="{data:{id:'"+objectArray[o]['edge']['interfaces']['interface'][i]['connectedToId']+"',name:'"+objectArray[o]['edge']['interfaces']['interface'][i]['connectedToName']+"',faveShape:'square'},classes:'dvportgroup'}";
								nodeArray.push(eval("("+portNode+")"));
							};
						};
					};
				};
			};
		}else{ //if the current object is a switch...
			id=objectArray[o]['virtualWire']['objectId'];
			name=objectArray[o]['virtualWire']['name'];
			shape='square';
			var transit=false;
			for(var a=0;a<objectArray.length;a++){ //for each object in the objectArray...
				if(objectArray[a].hasOwnProperty('interface')){ //if the object is a router with defined interfaces
					for(var i=0;i<objectArray[a]['interface']['type'].length;i++){ //for each interface defined for the current router...
						if(objectArray[o]['virtualWire']['objectId']==objectArray[a]['interface']['connectedToId'][i]&&objectArray[a]['interface']['type'][i]=='uplink'){ //if it's a transit...
							transit=true;
						};
					};
				};
			};
			if(transit==true){
				className='transit';
			}else{
				className='switch';
			};
		};
		thisNode="{data:{id:'"+id+"',name:'"+name+"',faveShape:'"+shape+"'},classes:'"+className+"'}";
		nodeArray.push(eval("("+thisNode+")"));
	};
};
function buildLinkArray(){ //function to gather link information and store the data in the linkArray
	for(var o=0;o<objectArray.length;o++){ //for each object in the objectArray...
		var thisLink='';
		if(objectArray[o].hasOwnProperty('edge')){ //if the object is a router
			if(objectArray[o]['edge']['type']=='gatewayServices'){ //if the object is a 'gatewayServices' router...
				for(var v=0;v<objectArray[o]['edge']['vnics']['vnic'].length;v++){
					if(objectArray[o]['edge']['vnics']['vnic'][v]['isConnected']=='true'){
						if(objectArray[o]['edge']['vnics']['vnic'][v]['portgroupId'].substring(0,12)=='dvportgroup-'||objectArray[o]['edge']['vnics']['vnic'][v]['type']=='uplink'){
							thisLink="{data:{source:'"+objectArray[o]['edge']['vnics']['vnic'][v]['portgroupId']+"',target:'"+objectArray[o]['edge']['id']+"',label:'"+objectArray[o]['edge']['vnics']['vnic'][v]['addressGroups']['addressGroup']['primaryAddress']+"'}}";
						}else{
							thisLink="{data:{source:'"+objectArray[o]['edge']['id']+"',target:'"+objectArray[o]['edge']['vnics']['vnic'][v]['portgroupId']+"',label:'"+objectArray[o]['edge']['vnics']['vnic'][v]['addressGroups']['addressGroup']['primaryAddress']+"'}}";
						};
						linkArray.push(eval("("+thisLink+")"));
					};
				};
			}else if(objectArray[o]['edge']['type']=='distributedRouter'){ //if the object is a 'distributedRouter'...
				for(var i=0;i<objectArray[o]['edge']['interfaces']['interface'].length;i++){
					if(objectArray[o]['edge']['interfaces']['interface'][i]['isConnected']=='true'){
						if(objectArray[o]['edge']['interfaces']['interface'][i]['connectedToId'].substring(0,12)=='dvportgroup-'||objectArray[o]['edge']['interfaces']['interface'][i]['type']=='uplink'){
							thisLink="{data:{source:'"+objectArray[o]['edge']['interfaces']['interface'][i]['connectedToId']+"',target:'"+objectArray[o]['edge']['id']+"',label:'"+objectArray[o]['edge']['interfaces']['interface'][i]['addressGroups']['addressGroup']['primaryAddress']+"'}}";
						}else{
							thisLink="{data:{source:'"+objectArray[o]['edge']['id']+"',target:'"+objectArray[o]['edge']['interfaces']['interface'][i]['connectedToId']+"',label:'"+objectArray[o]['edge']['interfaces']['interface'][i]['addressGroups']['addressGroup']['primaryAddress']+"'}}";
						};
						linkArray.push(eval("("+thisLink+")"));
					};
				};
			};
		};
	};
};
function drawDiagram(){
	$('#diagramDiv').cytoscape({
		layout:{
			name:'breadthfirst',
			directed:true
		},
		style:cytoscape.stylesheet()
		.selector('node').css({
			'shape':'data(faveShape)',
			'width':'30',
			'content':'data(name)',
			'text-valign':'center',
			'text-outline-width':2,
			'text-outline-color':'#02AAE0',
			'background-color':'#FFFFFF',
			'color':'#FFFFFF',
			'background-fit':'cover',
			'background-clip':'node'
		})
		.selector(':selected').css({
			'border-width':2,
			'border-color':'#AAAAAA'
		})
		.selector('edge').css({
			'opacity':'0.5',
			'width':'mapData(50,70,100,2,6)',
			'target-arrow-shape':'triangle',
			'source-arrow-shape':'circle',
			'line-color':'#02AAE0',
			'source-arrow-color':'#02AAE0',
			'target-arrow-color':'#02AAE0',
			'content':'data(label)'
		})
		.selector('.edge').css({
			'background-image':'img/edge.png'
		})
		.selector('.router').css({
			'background-image':'img/router.png'
		})
		.selector('.transit').css({
			'background-image':'img/transit.png'
		})
		.selector('.switch').css({
			'background-image':'img/switch.png'
		})
		.selector('.dvportgroup').css({
			'background-image':'img/vsphere.png'
		}),
		elements:{
			nodes:nodeArray,
			edges:linkArray
		},
	});
};
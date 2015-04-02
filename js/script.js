function edgeObject(){
	this.firewall="enabled";
	this.ha="true";
	this.management_iface="interface1";
	this.management_ip="0.0.0.0";
	this.name="edge";
	this.ospf_area="1";
	this.ospf_enabled="true";
	this.ospf_type="normal";
	this.ospf_internal="true";
	this.ospf_uplink="true";
	this.cli_enabled="true";
	this.cli_user="username";
	this.cli_pass="password";
	this.cli_expiredays="99999";
	this.tenant="";
	this.uplink_gateway="0.0.0.0";
	this.uplink_iface="interface1";
	this.uplink_ip="0.0.0.0";
	this.uplink_mask="255.255.255.255";
	this.uplink_name="uplink";
};
function transitObject(){
	this.edgeip="0.0.0.0";
	this.mask="255.255.255.255";
	this.name="transit";
	this.protoip="0.0.0.0";
	this.routerip="0.0.0.0";
};
function routerObject(){
	this.firewall="enabled";
	this.ha="true";
	this.management_iface="interface1";
	this.management_ip="0.0.0.0";
	this.name="router";
	this.ospf_area="1";
	this.ospf_enabled="true";
	this.ospf_type="normal"
	this.cli_enabled="true";
	this.cli_user="username";
	this.cli_pass="password";
	this.cli_expiredays="99999";
	this.cli_tenant="";
};
function switchObject(){
	this.ip="0.0.0.0";
	this.mask="255.255.255.255";
	this.name="switch1";
};
function vsphereObject(){
	this.cluster="cluster";
	this.datacenter="datacenter";
	this.datastore="datastore";
	this.folder="folder";
};
function initialize(){
	edgeArray=[];
	routerArray=[];
	switchArray=[];
	transitArray=[];
	vsphereArray=[];
	getObjects();
	console.log(edgeArray[0]['uplink_ip']);
	edgeArray[0]['uplink_ip']='noodleface';
	console.log(edgeArray[0]['uplink_ip']);
	for(var e=0;e<edgeArray.length;e++){
		drawObject('edge',e,edgeArray);
	};
	for(var t=0;t<transitArray.length;t++){
		drawObject('transit',t,transitArray);
	};
	for(var r=0;r<routerArray.length;r++){
		drawObject('router',r,routerArray);
	};
	for(var s=0;s<switchArray.length;s++){
		drawObject('switch',s,switchArray);
	};
};
function getObjects(){
	edgeArray.push(new edgeObject());
	transitArray.push(new transitObject());
	routerArray.push(new routerObject());
	switchArray.push(new switchObject());
	switchArray.push(new switchObject());
	switchArray.push(new switchObject());
};
function drawObject(type,id,array){
	var newDiv=document.createElement("div");
	newDiv.id=type+'Div_'+id;
	newDiv.className=type+'Div';
	document.getElementById('diagramDiv').appendChild(newDiv);
	var newTooltip=document.createElement("div");
	newTooltip.className=type+'Tooltip';
	newTooltip.innerHTML='<label class="tooltipLabel">'+array[id]['name']+'</label><br/><hr class="tooltipHr"/>';
	for(var property in array[id]){
		newTooltip.innerHTML+=property+': '+array[id][property]+'<br/>';
	};
	newDiv.appendChild(newTooltip);
	newDiv.addEventListener('mouseover',function(){
		this.getElementsByClassName(type+'Tooltip')[0].style.display="block";
	});
	newDiv.addEventListener('mouseout',function(){
		this.getElementsByClassName(type+'Tooltip')[0].style.display="none";
	});
};
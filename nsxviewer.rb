$url='nsx.manager.com'
$port='443'
$user='admin'
$pass='password'
###################
require 'pathname'
xmlFolder=Pathname.new('data/xml')
Dir.foreach(xmlFolder){|file|filename=File.join(xmlFolder,file);File.delete(filename) if file!='.' && file!='..'}
require 'net/https'
def getXML(path,filename)
	request=Net::HTTP::Get.new(path)
	request.basic_auth($user,$pass)
	data=$http.request(request)
	File.write(filename,data.body)
end
$http=Net::HTTP.new($url,$port)
$http.use_ssl=true
$http.verify_mode=OpenSSL::SSL::VERIFY_NONE
$http.start do |http|
	getXML('/api/2.0/vdn/controller','data/xml/controllers.xml')
	getXML('/api/2.0/vdn/config/segments','data/xml/segments.xml')
	getXML('/api/2.0/vdn/scopes','data/xml/scopes.xml')
	getXML('/api/2.0/vdn/switches','data/xml/switches.xml')
	getXML('/api/2.0/vdn/virtualwires','data/xml/virtualwires.xml')
	getXML('/api/4.0/edges','data/xml/edges.xml')
end
require 'rexml/document'
include REXML
doc=Document.new(File.new('data/xml/edges.xml'))
edgeCount=doc.elements['pagedEdgeList'].elements['edgePage'].elements['pagingInfo'].elements['totalCount'].text
if edgeCount.to_i>0
	puts 'Total number of edges: '+edgeCount
	$i=0
	while $i<edgeCount.to_i do
		getXML('/api/4.0/edges/'+$i+'/mgmtinterface','data/xml/edge'+$i+'mgmt.xml')
		getXML('/api/4.0/edges/'+$i+'/interfaces','data/xml/edge'+$i+'int.xml')
		getXML('/api/4.0/edges/'+$i+'/routing/config','data/xml/edge'+$i+'route.xml')
		getXML('/api/4.0/edges/'+$i+'/routing/config/ospf','data/xml/edge'+$i+'osfp.xml')
	end
else
	puts 'There are no edges.'
end

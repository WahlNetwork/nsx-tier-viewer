require './credentials.rb'
require 'pathname'
xmlFolder=Pathname.new('data') #define the path to the xml config files
Dir.foreach(xmlFolder){|file|filename=File.join(xmlFolder,file);File.delete(filename) if file!='.' && file!='..'} #delete any old config files
require 'net/https'
def getXML(path,filename) #define the 'getXML' function which grabs the xml from a given url and saves it in the config file folder
	request=Net::HTTP::Get.new(path) #set up the HTTP request to the given path
	request.basic_auth($user,$pass) #attach the credentials to the request
	data=$http.request(request) #perform the request and add the xml response to the 'data' variable
	File.write(filename,data.body) #write the xml data to the provided filename
end
$http=Net::HTTP.new($url,$port) #define the $http session with the provided $url and $port
$http.use_ssl=true #tell the session to use SSL
$http.verify_mode=OpenSSL::SSL::VERIFY_NONE #ignore self-signed SSL certs
$http.start do |http| #establish the $http session
	getXML('/api/2.0/vdn/virtualwires','data/virtualwires.xml') #pull and store virtualwire data
	getXML('/api/4.0/edges','data/edges.xml') #pull and store edge data
end
require 'rexml/document'
include REXML
edgeXML=Document.new(File.new('data/edges.xml')) #create the 'edgeXML' reference to the 'edges.xml' file
edgeCount=edgeXML.elements['pagedEdgeList'].elements['edgePage'].elements['pagingInfo'].elements['totalCount'].text #store the number of edges listed in 'edges.xml' in the 'edgeCount' variable
if edgeCount.to_i>0 #if any edges exist
	edgeXML.elements.each('pagedEdgeList/edgePage/edgeSummary/id') do |element| #for each edge...
		getXML('/api/4.0/edges/'+element.text,'data/'+element.text+'.xml') #pull primary edge data
	end
end
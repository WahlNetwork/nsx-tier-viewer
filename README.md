# nsx-tier-viewer

Welcome to the NSX Tier Viewer project!
The goal of this code is to provide a quick, simple visual representation of an NSX environment.

### Prerequisites:

* A target NSX Manager VM
* Ruby installed on the local system
* A web browser

### How To Use This Tool:

* Edit 'credentials.rb' and fill in the IP/hostname/URL, port, username, and password of the target NSX Manager VM
```
$url='0.0.0.0'
$port='443'
$user='admin'
$pass='password'
```
* Run 'script.rb' and then open 'index.html' (Windows users can just run 'runme.bat' instead)
* 'index.html' shold open and display the NSX topology
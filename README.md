#Initializing Submodules
```
git clone git@github.com:pwmckenna/oneclick.git
git submodule init
git submodule update
```
#Updating Submodules
Use this when you've changed code in one of the submodules, commited it, and now want to use that new code in this project.
```
git submodule -q foreach git pull -q origin master
```

#Build/Install (Development)  
Chrome -> Tools -> Extensions  
Enable *Developer Mode*  
Click *Load Unpacked Extension* and select this project directory  

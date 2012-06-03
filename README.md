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
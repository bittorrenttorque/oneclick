#Initializing Submodules
```
git clone git@github.com:bittorrenttorque/oneclick.git
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

#License
Copyright 2012 Patrick Williams, BitTorrent Inc.
http://torque.bittorrent.com/

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
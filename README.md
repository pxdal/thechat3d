# The Chat 3D
The sequel to the "beloved" project "The Chat", a chaotic online chat room that I created to test server-side node js scripts (https://github.com/ItsTheChickenMan/thechat).  This is the 3D interactive version, featuring the old chat you know and love, moving cubes, and broken physics.  This project is a pretty much a joke, but if you're really interested I host the server on:
http://75.133.182.85/

# Installation (for hosting)
If you want to host this yourself, installation is pretty straightforward:

Step 1: clone repo    `$ git clone https://github.com/ItsTheChickenMan/thechat3d`

Step 2: install deps  `$ npm install`

On Linux:

Step 3: run server.js with sudo `$ sudo node server.js`

On Windows:

Step 3: run server.js from shell as administrator `> node server.js`

Note that hosting on Apple hasn't been tested, and will remain that way because I don't have an Apple computer nor do I plan on getting one.  Proceed with caution.

If you want to make a server public, you'll have to do some port forwarding.  There are plenty of tutorials online, the only thing you need to know is that The Chat 3D defaults to port 80 (in some releases I accidentally leave it on 8080, so don't forget to change it).  Once you port forward port 80 to your computer's private ip, anyone should be able to access the server simply by going to your public ip address in a web browser.

# Using the C3D Engine
Want to use the c3d engine for your own projects?  don't.  If you want to make a serious project, use something more reliable.  If you want to make something silly or personal, just know that there's no documentation and the engine is really stupid.  There'll be a lot of unnecessary headaches.

# Info
Join the development discord server: https://discord.com/invite/KTCz4tU

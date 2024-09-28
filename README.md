# The Chat 3D
A goofy project I made back when I was really into game development in high school.  I still like gamedev, but I had this weird idea that making my own engine for everything was somehow always the best idea, and as a result I never really made any actual progress on any playable experience.  "The Chat 3D" is very good evidence of this, as in its latest state it exists as a small world where all you can do is move around as a cube and type in a basic text chat.  I did try to add some fun stuff, but generally I was too bogged down with making the engine work to focus on making a game.  At least I had the self awareness to say that it was bad in the README.

I've left the original README as it was before this commit below, mostly because I think it deserves preservation.  It's certainly embarrassing in some ways, but in a way I think that the project is weirdly charming.  Even if my long term goals were fairly misguided, I will still at least fondly remember the hours I would spend programming this silly little project.  It was good exercise, if nothing else. Also, the discord invite link is dead now, sorry.

# The Chat 3D
The sequel to the "beloved" project "The Chat", a chaotic online chat room that I created to test server-side node js scripts (https://github.com/ItsTheChickenMan/thechat).  This is the 3D interactive version, featuring the old chat you know and love, moving cubes, and broken physics.  This project is a pretty much a joke, but if you're really interested feel free to download it and give it a try.

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
~~Join the development discord server~~ this project isn't being developed anymore, but the discord is still there if you want to chat: https://discord.com/invite/KTCz4tU

Files:
app - contains JavaScript and HTML files for rendering the WebGL living room scene
lib - contains all necessary resource files for WebGL and the files contained in app
textures - contains .jpeg files for each texture used in rendering the scene

Instructions for use:
- Open living-room.html in a WebGL-compatible web browser (preferably Google Chrome).
- The cross-origin resource sharing (CORS) policy will restrict the living-room.js from retrieving its associated texture files. To overcome this, use the Chrome browser parameter '-allow-file-access-from-files', or host this folder on a local server (I used npm's http-server package).

Other information:
- living-room.js looks for the texture images in the path '../textures', so please ensure the file structure is maintained to accommodate this.
- living-room.js also looks for the WebGL resource files in the path '../lib', so please also ensure the file structure is maintained for this too.

Many thanks, and I hope you enjoy my scene!
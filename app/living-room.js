///////////////
/// SHADERS ///
///////////////

// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Normal;\n' +
  'attribute vec2 a_TexCoord;\n' +
  'uniform mat4 u_MvpMatrix;\n' +
  'uniform mat4 u_ModelMatrix;\n' +
  'uniform mat4 u_NormalMatrix;\n' +
  'uniform vec3 u_LightColor;\n' + 
  'uniform vec3 u_LightPosition;\n' +
  'uniform vec3 u_AmbientLight;\n' +  
  'varying vec4 v_Lighting;\n' +
  'varying vec2 v_TexCoord;\n' +
  'uniform sampler2D u_Texture;\n' +
  'void main() {\n' +
  '  gl_Position = u_MvpMatrix * a_Position;\n' +
  '  vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
  '  vec4 vertexPosition = u_ModelMatrix * a_Position;\n' +
  '  vec3 lightDirection = normalize(u_LightPosition - vec3(vertexPosition));\n' +
  '  float nDotL = max(dot(lightDirection, normal), 0.0);\n' +
  '  vec3 diffuse = u_LightColor * nDotL;\n' +
  '  vec3 ambient = u_AmbientLight;\n' +
  '  v_Lighting = vec4(diffuse + ambient, 1);\n' +  
  '  v_TexCoord = a_TexCoord;\n' +  
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'uniform sampler2D u_Texture;\n' +
  'uniform float u_Intensity;\n' +
  'varying vec2 v_TexCoord;\n' +
  'varying vec4 v_Lighting;\n' +
  'void main() {\n' +
  '  vec4 color = texture2D(u_Texture, v_TexCoord);\n' +
  '  gl_FragColor = vec4(v_Lighting.rgb * color.rgb * u_Intensity, color.a);\n' +
  '}\n';

//-------------
// MAIN
//-------------

function main() {
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl');

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas);
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL');
    return;
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.');
    return;
  }

  // Set the clear color to white and enable the depth test
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  // Initialise textures
  if (!initTextures(gl)) {
    console.log('Failed to intialize the texture.');
    return;
  }

  var program = gl.program;

  // Get the storage locations of attribute variables
  program.a_Position = gl.getAttribLocation(program, 'a_Position');
  program.a_Normal = gl.getAttribLocation(program, 'a_Normal');
  program.a_TexCoord = gl.getAttribLocation(program, 'a_TexCoord');

  // Get the storage locations of uniform variables
  program.u_MvpMatrix = gl.getUniformLocation(program, 'u_MvpMatrix');
  program.u_NormalMatrix = gl.getUniformLocation(program, 'u_NormalMatrix');
  program.u_ModelMatrix = gl.getUniformLocation(program, 'u_ModelMatrix');
  program.u_LightColor = gl.getUniformLocation(program, 'u_LightColor');
  program.u_LightPosition = gl.getUniformLocation(program, 'u_LightPosition');
  program.u_AmbientLight = gl.getUniformLocation(program, 'u_AmbientLight');
  program.u_Intensity = gl.getUniformLocation(program, 'u_Intensity');

  if (program.a_Position < 0 ||  program.a_Normal < 0 || program.a_TexCoord < 0 ||
      !program.u_MvpMatrix || !program.u_NormalMatrix || !program.u_ModelMatrix ||
      !program.u_LightColor || !program.u_LightPosition || !program.u_AmbientLight ||
      !program.u_Intensity) {
    console.log('Failed to get variable storage location'); 
    return;
  }

  // Set light color to white
  gl.uniform3f(program.u_LightColor, 1.0, 1.0, 1.0);
  // Set the light position
  gl.uniform3f(program.u_LightPosition, 0.0, 3.0, 0.0);
  // Set the ambient light
  gl.uniform3f(program.u_AmbientLight, 0.2, 0.2, 0.2);
  // Set light instensity
  gl.uniform1f(program.u_Intensity, lightIntensity);

  var modelMatrix = new Matrix4();  // Model matrix
  var mvpMatrix = new Matrix4();    // Model view projection matrix
  var normalMatrix = new Matrix4(); // Transformation matrix for normals

  // Calculate the model matrix
  modelMatrix.setRotate(90, 0, 1, 0); 
  // Pass the model matrix to u_ModelMatrix
  gl.uniformMatrix4fv(program.u_ModelMatrix, false, modelMatrix.elements);

  // Pass the model view projection matrix to u_MvpMatrix
  mvpMatrix.setPerspective(30, canvas.width/canvas.height, 1, 100);
  mvpMatrix.lookAt(30, 30, 30, 0, 0, 0, 0, 1, 0);
  mvpMatrix.multiply(modelMatrix);
  gl.uniformMatrix4fv(program.u_MvpMatrix, false, mvpMatrix.elements);

  // Pass the matrix to transform the normal based on the model matrix to u_NormalMatrix
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(program.u_NormalMatrix, false, normalMatrix.elements);

  // Prepare empty buffer objects for vertex coordinates and normals
  var model = initVertexBuffers(gl);
  
  // Draw on each call of update
  function update() {
    // Handle key presses
    document.onkeydown = function (ev) {

      // Store current keypress in dictionary
      keyDown[ev.keyCode] = true;

      // Handle key input
      if(keyDown[39] == true) { // The right arrow key was pressed
        rotationAngle = (rotationAngle - 3) % 360;
      } 

      if (keyDown[37] == true) { // The left arrow key was pressed
        rotationAngle = (rotationAngle + 3) % 360;
      } 

      if (keyDown[38] == true) { // The up arrow key was pressed
        if (g_viewY < 50) {
          g_viewY += 1;
        }
      }

      if (keyDown[40] == true) { // The down arrow key was pressed
        if (g_viewY > 0) {
          g_viewY -= 1; 
        }
      }

      if (keyDown[90] == true) { // Z was pressed
        if (g_viewX > 10) {
          g_viewX -= 1; 
        }
      }

      if (keyDown[88] == true) { // X was pressed
        if (g_viewX < 50) {
          g_viewX += 1;
        }
      }

      if (keyDown[84] == true) { // T was pressed
        tvOn = !tvOn;
      }

      if (keyDown[66] == true) { // B was pressed
        newBeanBagAngle = beanBagAngle + 90;
      }

      if (keyDown[76] == true) { // L was pressed
        animateLamps = true;
        lightOn = !lightOn;
      }

      // Update perspective and lookAt with new coordinates
      viewMatrix = new Matrix4().setIdentity();

      // mat4.translate(viewMatrix.elements, viewMatrix.elements, vec3.fromValues(0,0,1));
      // mat4.rotateX(viewMatrix.elements, viewMatrix.elements, g_viewX);
      // mat4.rotateY(viewMatrix.elements, viewMatrix.elements, g_viewY);

      // mvpMatrix.set(mvpMatrix);
      // mvpMatrix.multiply(viewMatrix);

      mvpMatrix.setPerspective(g_viewX, canvas.width/canvas.height, 1, 100);
      mvpMatrix.lookAt(30, g_viewY, 30, 0, 0, 0, 0, 1, 0);
      mvpMatrix.multiply(modelMatrix);
    };
    
    document.onkeyup = function(ev) {
      keyDown[ev.keyCode] = false;
    };

    // Animate speakers if TV is on
    if (tvOn) {
      if (growing == true && scale < 1.05) {
        scale += 0.005;
      } else if (scale >= 1.05) {
        growing = false;
        scale -= 0.005;
      } else if (growing == false && scale > 1) {
        scale -= 0.005;
      } else if (scale <= 1) {
        growing = true;
        scale += 0.005;
      }
    } else {
      scale = 1;
    }

    // Rotate bean bag
    if (beanBagAngle != newBeanBagAngle) {
      beanBagAngle += 1;
    }

    // Animate lamp shades
    if (animateLamps) {
      if (shadeHeight > 53) {
        shadeHeight -= 1;
      } else if (shadeHeight == 53) {
        animateLamps = false;
      }
    } else if (shadeHeight < 58) {
      shadeHeight += 1;
    }

    // Turn lights on/off and alter light intensity
    if (lightOn) {
      if (lightIntensity < 1) {
        lightIntensity += 0.05;
      }
      gl.uniform1f(program.u_Intensity, lightIntensity);
    } else {
      if (lightIntensity > 0.3) {
        lightIntensity -= 0.05;
      }
      gl.uniform1f(program.u_Intensity, lightIntensity);
    }

    // Draw scene and request next frame
    draw(gl, model, mvpMatrix, program.u_MvpMatrix, program.u_NormalMatrix);
    window.requestAnimationFrame(update);
  }

  window.requestAnimationFrame(update);
}

//------------------
// FUNCTIONS 
//------------------

// Preset rotation angle
var rotationAngle = 0;
// Coordinate transformation matrix
var g_modelMatrix = new Matrix4(), g_mvpMatrix = new Matrix4(), g_normalMatrix = new Matrix4();

// Draw models
function draw(gl, model, viewProjMatrix, u_MvpMatrix, u_NormalMatrix) {
  // Clear color and depth buffer
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  // Set texture to carpet
  gl.bindTexture(gl.TEXTURE_2D, textures[0]);

  // Draw carpet
  g_modelMatrix.setTranslate(0.0, 0.0, 0.0);
  g_modelMatrix.rotate(rotationAngle, 0.0, 1.0, 0.0);
  drawBox(gl, model, 10, 0.1, 10, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);

  // Assign following models as all part of table
  pushMatrix(g_modelMatrix);

  // Draw table
  drawTable(gl, model, -0.3, 19.5, 0.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);

  // Draw coaster 1
  drawCoaster(gl, model, 0.6, 1.3, 0.8, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);

  // Draw coaster 2
  drawCoaster(gl, model, -0.6, 1.3, -0.8, viewProjMatrix, u_MvpMatrix, u_NormalMatrix)
  
  // Draw remote
  drawRemote(gl, model, -0.6, 1.3, 0.6, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
  g_modelMatrix = popMatrix(g_modelMatrix);

  // Assign long sofa as child of carpet
  pushMatrix(g_modelMatrix);

  // Draw long sofa
  drawLongSofa(gl, model, -0.9, 19, 0.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
  g_modelMatrix = popMatrix(g_modelMatrix);

  // Assign short sofa as child of carpet
  pushMatrix(g_modelMatrix);

  // Draw short sofa
  drawShortSofa(gl, model, -0.3, 19.0, 0.8, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
  g_modelMatrix = popMatrix(g_modelMatrix);

  // Assign lamp 1 as child of carpet
  pushMatrix(g_modelMatrix);

  // Draw lamp 1
  drawLamp(gl, model, 0.2, 1.0, 0.75, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
  g_modelMatrix = popMatrix(g_modelMatrix);

  // Assign lamp 1 as child of carpet
  pushMatrix(g_modelMatrix);
  
  // Draw lamp 2
  drawLamp(gl, model, -0.8, 1.0, -0.8, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
  g_modelMatrix = popMatrix(g_modelMatrix);

  // Assign rug as child of carpet
  pushMatrix(g_modelMatrix);

  // Draw rug
  drawRug(gl, model, 0.2, 1.0, 0.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
  g_modelMatrix = popMatrix(g_modelMatrix);

  // Assign bean bag as child of carpet
  pushMatrix(g_modelMatrix);

  // Draw bean bag
  drawBeanbag(gl, model, -0.2, 11.0, -0.7, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
  g_modelMatrix = popMatrix(g_modelMatrix);

  // Assign cabinet as child of carpet
  pushMatrix(g_modelMatrix);

  // Draw cabinet
  drawCabinet(gl, model, 0.8, 19.5, 0.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);

  // Draw TV as child of cabinet
  drawTV(gl, model, 0.0, 1.0, 0.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
  g_modelMatrix = popMatrix(g_modelMatrix);

  // Assign speaker 1 as child of carpet
  pushMatrix(g_modelMatrix);

  // Draw speaker 1
  drawSpeaker(gl, model, 0.8, 19.5, -0.7, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
  g_modelMatrix = popMatrix(g_modelMatrix);

  // Assign speaker 2 as child of carpet
  pushMatrix(g_modelMatrix);

  // Draw speaker 2
  drawSpeaker(gl, model, 0.8, 19.5, 0.7, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
  g_modelMatrix = popMatrix(g_modelMatrix);
}


// Draw cuboid of specified dimensions
function drawBox(gl, model, width, height, depth, viewProjMatrix, u_MvpMatrix, u_NormalMatrix) {

  // Scale box dimensions
  g_modelMatrix.scale(width, height, depth);

  // Calculate the model view project matrix and pass it to u_MvpMatrix
  g_mvpMatrix.set(viewProjMatrix);
  g_mvpMatrix.multiply(g_modelMatrix);
  gl.uniformMatrix4fv(u_MvpMatrix, false, g_mvpMatrix.elements);

  // Calculate the normal transformation matrix and pass it to u_NormalMatrix
  g_normalMatrix.setInverseOf(g_modelMatrix);
  g_normalMatrix.transpose();
  gl.uniformMatrix4fv(u_NormalMatrix, false, g_normalMatrix.elements);

  // Draw
  gl.drawElements(gl.TRIANGLES, model, gl.UNSIGNED_BYTE, 0);
}

function drawLongSofa(gl, model, x, y, z, viewProjMatrix, u_MvpMatrix, u_NormalMatrix) {
  // Set texture to suede
  gl.bindTexture(gl.TEXTURE_2D, textures[3]);

  // Back of sofa
  g_modelMatrix.translate(x, y, z);
  drawBox(gl, model, 0.05, 18, 0.5, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);

  // Front of sofa
  pushMatrix(g_modelMatrix);
  g_modelMatrix.translate(2.0, -0.6, 0.0);
  drawBox(gl, model, 2.5, 0.4, 1.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
  g_modelMatrix = popMatrix(g_modelMatrix);

  // Arm 1
  pushMatrix(g_modelMatrix);
  g_modelMatrix.translate(1.8, -0.4, -1.1);
  drawBox(gl, model, 2.7, 0.6, 0.1, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
  g_modelMatrix = popMatrix(g_modelMatrix);

  // Arm 2
  pushMatrix(g_modelMatrix);
  g_modelMatrix.translate(1.8, -0.4, 1.1);
  drawBox(gl, model, 2.7, 0.6, 0.1, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
  g_modelMatrix = popMatrix(g_modelMatrix);
}

function drawShortSofa(gl, model, x, y, z, viewProjMatrix, u_MvpMatrix, u_NormalMatrix) {
  // Set texture to suede
  gl.bindTexture(gl.TEXTURE_2D, textures[3]);
  
  // Back of sofa
  g_modelMatrix.translate(x, y, z);
  g_modelMatrix.rotate(90, 0.0, 1.0, 0.0);
  drawBox(gl, model, 0.05, 18, 0.2, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);

  // Front of sofa
  pushMatrix(g_modelMatrix);
  g_modelMatrix.translate(2.0, -0.6, 0.0);
  drawBox(gl, model, 2.5, 0.4, 1.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
  g_modelMatrix = popMatrix(g_modelMatrix);

  // Arm 1
  pushMatrix(g_modelMatrix);
  g_modelMatrix.translate(1.8, -0.4, -1.1);
  drawBox(gl, model, 2.7, 0.6, 0.1, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
  g_modelMatrix = popMatrix(g_modelMatrix);

  // Arm 2
  pushMatrix(g_modelMatrix);
  g_modelMatrix.translate(1.8, -0.4, 1.1);
  drawBox(gl, model, 2.7, 0.6, 0.1, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
  g_modelMatrix = popMatrix(g_modelMatrix);
}

function drawCoaster(gl, model, x, y, z, viewProjMatrix, u_MvpMatrix, u_NormalMatrix) {
  // Set texture to brass
  gl.bindTexture(gl.TEXTURE_2D, textures[2]);

  // Coaster
  pushMatrix(g_modelMatrix);
  g_modelMatrix.translate(x, y, z);
  drawBox(gl, model, 0.15, 0.2, 0.1, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
  g_modelMatrix = popMatrix(g_modelMatrix);
}

function drawRemote(gl, model, x, y, z, viewProjMatrix, u_MvpMatrix, u_NormalMatrix) {
  // Set texture to gloss
  gl.bindTexture(gl.TEXTURE_2D, textures[8]);

  // Coaster
  g_modelMatrix.translate(x, y, z);
  g_modelMatrix.rotate(30, 0.0, 1.0, 0.0);
  drawBox(gl, model, 0.45, 0.3, 0.08, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);

  // Set texture to plastic
  gl.bindTexture(gl.TEXTURE_2D, textures[9]);

  // Button 1
  pushMatrix(g_modelMatrix);
  g_modelMatrix.translate(-0.5, 1.0, 0.0);
  drawBox(gl, model, 0.3, 0.5, 0.7, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
  g_modelMatrix = popMatrix(g_modelMatrix);

  // Button 2
  pushMatrix(g_modelMatrix);
  g_modelMatrix.translate(0.2, 1.0, 0.0);
  drawBox(gl, model, 0.2, 0.5, 0.7, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
  g_modelMatrix = popMatrix(g_modelMatrix);

  // Set texture to power button
  gl.bindTexture(gl.TEXTURE_2D, textures[11]);

  // Power button
  pushMatrix(g_modelMatrix);
  g_modelMatrix.translate(0.8, 1.0, 0.4);
  drawBox(gl, model, 0.08, 0.5, 0.4, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
  g_modelMatrix = popMatrix(g_modelMatrix);
}

function drawTable(gl, model, x, y, z, viewProjMatrix, u_MvpMatrix, u_NormalMatrix) {

  // Set texture to wood
  gl.bindTexture(gl.TEXTURE_2D, textures[1]);

  // Tabletop
  g_modelMatrix.translate(x, y, z);
  drawBox(gl, model, 0.15, 2, 0.25, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);

  // Leg 1
  pushMatrix(g_modelMatrix);
  g_modelMatrix.translate(0.9, -5, 0.9);
  drawBox(gl, model, 0.1, 4, 0.1, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
  g_modelMatrix = popMatrix(g_modelMatrix);

  // Leg 2
  pushMatrix(g_modelMatrix);
  g_modelMatrix.translate(-0.9, -5, 0.9);
  drawBox(gl, model, 0.1, 4, 0.1, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
  g_modelMatrix = popMatrix(g_modelMatrix);

  // Leg 3
  pushMatrix(g_modelMatrix);
  g_modelMatrix.translate(0.9, -5, -0.9);
  drawBox(gl, model, 0.1, 4, 0.1, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
  g_modelMatrix = popMatrix(g_modelMatrix);

  // Leg 4
  pushMatrix(g_modelMatrix);
  g_modelMatrix.translate(-0.9, -5, -0.9);
  drawBox(gl, model, 0.1, 4, 0.1, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
  g_modelMatrix = popMatrix(g_modelMatrix);
}

function drawLamp(gl, model, x, y, z, viewProjMatrix, u_MvpMatrix, u_NormalMatrix) {
  // Set texture to iron
  gl.bindTexture(gl.TEXTURE_2D, textures[4]);

  // Base
  g_modelMatrix.translate(x, y, z);
  drawBox(gl, model, 0.1, 1, 0.1, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);

  // Pole
  pushMatrix(g_modelMatrix);
  g_modelMatrix.translate(0, 30, 0);
  drawBox(gl, model, 0.1, 30, 0.1, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
  g_modelMatrix = popMatrix(g_modelMatrix);

  // Set texture to canvas
  gl.bindTexture(gl.TEXTURE_2D, textures[5]);

  // Shade 1
  pushMatrix(g_modelMatrix);
  g_modelMatrix.translate(0, shadeHeight, -1.1);
  drawBox(gl, model, 1.2, 7, 0.1, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
  g_modelMatrix = popMatrix(g_modelMatrix);

  // Shade 2
  pushMatrix(g_modelMatrix);
  g_modelMatrix.translate(-1.1, shadeHeight, 0);
  drawBox(gl, model, 0.1, 7, 1.2, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
  g_modelMatrix = popMatrix(g_modelMatrix);

  // Shade 3
  pushMatrix(g_modelMatrix);
  g_modelMatrix.translate(0, shadeHeight, 1.1);
  drawBox(gl, model, 1.2, 7, 0.1, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
  g_modelMatrix = popMatrix(g_modelMatrix);

  // Shade 4
  pushMatrix(g_modelMatrix);
  g_modelMatrix.translate(1.1, shadeHeight, 0);
  drawBox(gl, model, 0.1, 7, 1.2, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
  g_modelMatrix = popMatrix(g_modelMatrix);
}

function drawRug(gl, model, x, y, z, viewProjMatrix, u_MvpMatrix, u_NormalMatrix) {
  // Set texture to rug 
  gl.bindTexture(gl.TEXTURE_2D, textures[6]);

  // Rug
  g_modelMatrix.translate(x, y, z);
  drawBox(gl, model, 0.25, 1, 0.35, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
}

function drawBeanbag(gl, model, x, y, z, viewProjMatrix, u_MvpMatrix, u_NormalMatrix) {
  // Set texture to wool
  gl.bindTexture(gl.TEXTURE_2D, textures[7]);
  
  // Back of sofa
  g_modelMatrix.translate(x, y, z);
  g_modelMatrix.rotate(beanBagAngle, 0.0, 1.0, 0.0);
  drawBox(gl, model, 0.15, 10, 0.15, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
}

function drawCabinet(gl, model, x, y, z, viewProjMatrix, u_MvpMatrix, u_NormalMatrix) {
  // Set texture to gloss
  gl.bindTexture(gl.TEXTURE_2D, textures[8]);

  // Top
  g_modelMatrix.translate(x, y, z);
  drawBox(gl, model, 0.15, 2, 0.5, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);

  // Shelf
  pushMatrix(g_modelMatrix);
  g_modelMatrix.translate(0.0, -6.0, 0.0);
  drawBox(gl, model, 1.0, 1.0, 1.0, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
  g_modelMatrix = popMatrix(g_modelMatrix);

  // Leg 1
  pushMatrix(g_modelMatrix);
  var legLength = 4;
  g_modelMatrix.translate(0.9, -1-legLength, 0.9);
  drawBox(gl, model, 0.1, legLength, 0.1, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
  g_modelMatrix = popMatrix(g_modelMatrix);

  // Leg 2
  pushMatrix(g_modelMatrix);
  g_modelMatrix.translate(-0.9, -1-legLength, 0.9);
  drawBox(gl, model, 0.1, legLength, 0.1, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
  g_modelMatrix = popMatrix(g_modelMatrix);

  // Leg 3
  pushMatrix(g_modelMatrix);
  g_modelMatrix.translate(0.9, -1-legLength, -0.9);
  drawBox(gl, model, 0.1, legLength, 0.1, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
  g_modelMatrix = popMatrix(g_modelMatrix);

  // Leg 4
  pushMatrix(g_modelMatrix);
  g_modelMatrix.translate(-0.9, -1-legLength, -0.9);
  drawBox(gl, model, 0.1, legLength, 0.1, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
  g_modelMatrix = popMatrix(g_modelMatrix);
}

function drawTV(gl, model, x, y, z, viewProjMatrix, u_MvpMatrix, u_NormalMatrix) {
  // Set texture to iron
  gl.bindTexture(gl.TEXTURE_2D, textures[4]);

  // Base
  g_modelMatrix.translate(x, y, z);
  drawBox(gl, model, 0.7, 0.5, 0.6, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);

  // Stem
  pushMatrix(g_modelMatrix);
  g_modelMatrix.translate(0.5, 15.0, 0.0);
  drawBox(gl, model, 0.15, 15.0, 0.1, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
  g_modelMatrix = popMatrix(g_modelMatrix);

  // Back
  pushMatrix(g_modelMatrix);
  g_modelMatrix.translate(0.15, 25.0, 0.0);
  drawBox(gl, model, 0.2, 20.0, 1.5, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
  g_modelMatrix = popMatrix(g_modelMatrix);

  // Set texture to gloss if off, or soundwave if on
  if (tvOn) {
    gl.bindTexture(gl.TEXTURE_2D, textures[12]);
  } else {
    gl.bindTexture(gl.TEXTURE_2D, textures[8]);
  }

  // Screen
  pushMatrix(g_modelMatrix);
  g_modelMatrix.translate(0.1, 25.0, 0.0);
  drawBox(gl, model, 0.2, 18.0, 1.4, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
  g_modelMatrix = popMatrix(g_modelMatrix);
}

function drawSpeaker(gl, model, x, y, z, viewProjMatrix, u_MvpMatrix, u_NormalMatrix) {
  // Set texture to plastic
  gl.bindTexture(gl.TEXTURE_2D, textures[9]);

  // Speaker body
  g_modelMatrix.translate(x, y, z);

  drawBox(gl, model, 0.1*scale, 15.0*scale, 0.1*scale, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);

  // Set texture to mesh
  gl.bindTexture(gl.TEXTURE_2D, textures[10]);

  // Speaker mesh
  pushMatrix(g_modelMatrix);
  g_modelMatrix.translate(-1.0, 0.0, 0.0);
  drawBox(gl, model, 0.1, 0.9, 0.8, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
  g_modelMatrix = popMatrix(g_modelMatrix);
}

// Stack for storing matrices
var g_matrixStack = [];

// Push to matrix stack
function pushMatrix(m) {
  var m2 = new Matrix4(m);
  g_matrixStack.push(m2);
}

// Pop from matrix stack
function popMatrix() {
  return g_matrixStack.pop();
}

var keyDown = {}; // Dictionary to store keypresses

var g_viewY = 30; // Initial Y coord for virtual camera position
var g_viewX = 30; // Inital X coord for virtual camera position

var tvOn = false; // Whether TV is on or off
var scale = 0; // Scales objects for animations
var growing = true; // Indicates direction for animations
var beanBagAngle = 35; // Rotation (in degrees) of beanbag
var newBeanBagAngle = 35; // Stores new angle for beanbag animation
var animateLamps = false; // Defines lamp animation
var shadeHeight = 58; // Height of lamp shades
var lightIntensity = 1; // Intensity of light
var lightOn = true; // Defines whether light is on

// Create and initialise a buffer object for cubes
function initVertexBuffers(gl) {

  // Array of vertices for unit cube
  var vertices = new Float32Array([
    1.0, 1.0, 1.0,  -1.0, 1.0, 1.0,  -1.0,-1.0, 1.0,   1.0,-1.0, 1.0, // v0-v1-v1-v3 front
    1.0, 1.0, 1.0,   1.0,-1.0, 1.0,   1.0,-1.0,-1.0,   1.0, 1.0,-1.0, // v0-v3-v4-v5 right
    1.0, 1.0, 1.0,   1.0, 1.0,-1.0,  -1.0, 1.0,-1.0,  -1.0, 1.0, 1.0, // v0-v5-v6-v1 up
   -1.0, 1.0, 1.0,  -1.0, 1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0,-1.0, 1.0, // v1-v6-v7-v1 left
   -1.0,-1.0,-1.0,   1.0,-1.0,-1.0,   1.0,-1.0, 1.0,  -1.0,-1.0, 1.0, // v7-v4-v3-v1 down
    1.0,-1.0,-1.0,  -1.0,-1.0,-1.0,  -1.0, 1.0,-1.0,   1.0, 1.0,-1.0  // v4-v7-v6-v5 back
  ]);

  // Texture coordinates
  var texCoords = new Float32Array([
    1.0, 1.0,   0.0, 1.0,   0.0, 0.0,   1.0, 0.0,    // v0-v1-v2-v3 front
    0.0, 1.0,   0.0, 0.0,   1.0, 0.0,   1.0, 1.0,    // v0-v3-v4-v5 right
    1.0, 0.0,   1.0, 1.0,   0.0, 1.0,   0.0, 0.0,    // v0-v5-v6-v1 up
    1.0, 1.0,   0.0, 1.0,   0.0, 0.0,   1.0, 0.0,    // v1-v6-v7-v2 left
    0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0,    // v7-v4-v3-v2 down
    0.0, 0.0,   1.0, 0.0,   1.0, 1.0,   0.0, 1.0     // v4-v7-v6-v5 back
  ]);

  // Normals of cube
  var normals = new Float32Array([
    0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,   0.0, 0.0, 1.0,  // v0-v1-v2-v3 front
    1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,   1.0, 0.0, 0.0,  // v0-v3-v4-v5 right
    0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,   0.0, 1.0, 0.0,  // v0-v5-v6-v1 up
   -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  -1.0, 0.0, 0.0,  // v1-v6-v7-v2 left
    0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,   0.0,-1.0, 0.0,  // v7-v4-v3-v2 down
    0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0,   0.0, 0.0,-1.0   // v4-v7-v6-v5 back
  ]);

  // Indices of the vertices
  var indices = new Uint8Array([
    0, 1, 2,   0, 2, 3,    // front
    4, 5, 6,   4, 6, 7,    // right
    8, 9,10,   8,10,11,    // up
   12,13,14,  12,14,15,    // left
   16,17,18,  16,18,19,    // down
   20,21,22,  20,22,23     // back
  ]);

  // Write the vertex property to buffers (coordinates, texture coordinates and normals)
  if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Normal', normals, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_TexCoord', texCoords, 2, gl.FLOAT)) return -1;

  // Unbind the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer();
  if (!indexBuffer) {
    console.log('Failed to create the buffer object');
    return false;
  }

  // Bind buffer object and store indices
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
}

// Initialise array buffers
function initArrayBuffer(gl, attribute, data, num, type) {
  // Create a buffer object
  var buffer = gl.createBuffer();
  if (!buffer) {
    console.log('Failed to create the buffer object');
    return false;
  }
  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);

  // Assign the buffer object to the attribute variable
  var a_attribute = gl.getAttribLocation(gl.program, attribute);
  if (a_attribute < 0) {
    console.log('Failed to get the storage location of ' + attribute);
    return false;
  }
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0);
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_attribute);

  return true;
}

// Initialise textures
function initTextures(gl) {
  // Get the storage location of u_Texture
  var u_Texture = gl.getUniformLocation(gl.program, 'u_Texture');
  if (!u_Texture) {
    console.log('Failed to get the storage location of u_Texture');
    return false;
  }

  // Initialise list of images
  var images = [];

  // Create image objects
  var image1 = new Image();
  var image2 = new Image();
  var image3 = new Image();
  var image4 = new Image();
  var image5 = new Image();
  var image6 = new Image();
  var image7 = new Image();
  var image8 = new Image();
  var image9 = new Image();
  var image10 = new Image();
  var image11 = new Image();
  var image12 = new Image();
  var image13 = new Image();

  // Tell the browser to load images
  image1.src = '../textures/carpet.jpg';
  image2.src = '../textures/wood.jpg';
  image3.src = '../textures/brass.jpg';
  image4.src = '../textures/suede.jpg';
  image5.src = '../textures/iron.jpg';
  image6.src = '../textures/canvas.jpg';
  image7.src = '../textures/rug.jpg';
  image8.src = '../textures/wool.jpg';
  image9.src = '../textures/gloss.jpg';
  image10.src = '../textures/plastic.jpg';
  image11.src = '../textures/mesh.jpg';
  image12.src = '../textures/powerbutton.jpg';
  image13.src = '../textures/soundwave.jpg';
  
  // Push images to array
  images.push(image1);
  images.push(image2);
  images.push(image3);
  images.push(image4);
  images.push(image5);
  images.push(image6);
  images.push(image7);
  images.push(image8);
  images.push(image9);
  images.push(image10);
  images.push(image11);
  images.push(image12);
  images.push(image13);

  // Register the event handler to be called when image loading is completed
  image13.onload = function(){ loadTextures(gl, u_Texture, images); };

  return true;
}

var textures = [];

function loadTextures(gl, u_Texture, images) {
  for (var i = 0; i < images.length; i++) {

    // Create and bind the texture object to the target
    var texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);

    // Flip the image Y coordinate
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);

    // Pass texture unit to u_Texture
    gl.uniform1i(u_Texture, 0);

    // Set texture parameters
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    // Set the image to texture
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, images[i]);

    // Push texture to array of textures
    textures.push(texture);
  }
}
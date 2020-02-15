///////////////
/// SHADERS ///
///////////////

// Vertex shader program
var VSHADER_SOURCE =
  'attribute vec4 a_Position;\n' +
  'attribute vec4 a_Color;\n' +
  'attribute vec4 a_Normal;\n' +
  'attribute vec2 a_TexCoord;\n' +
  'uniform mat4 u_MvpMatrix;\n' +
  'uniform mat4 u_ModelMatrix;\n' +   // Model matrix
  'uniform mat4 u_NormalMatrix;\n' +  // Transformation matrix of the normal
  'uniform vec3 u_LightColor;\n' +    // Light color
  'uniform vec3 u_LightPosition;\n' + // Position of the light source (in the world coordinate system)
  'uniform vec3 u_AmbientLight;\n' +  // Ambient light color
  'varying vec4 v_Color;\n' +
  'varying vec2 v_TexCoord;\n' +
  'uniform sampler2D u_Texture;\n' +
  'void main() {\n' +
  '  gl_Position = u_MvpMatrix * a_Position;\n' +
     // Recalculate the normal based on the model matrix and make its length 1.
  '  vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));\n' +
     // Calculate world coordinate of vertex
  '  vec4 vertexPosition = u_ModelMatrix * a_Position;\n' +
     // Add texture coords
  '  v_TexCoord = a_TexCoord;\n' +  
     // Calculate the light direction and make it 1.0 in length
  '  vec3 lightDirection = normalize(u_LightPosition - vec3(vertexPosition));\n' +
     // The dot product of the light direction and the normal
  '  float nDotL = max(dot(lightDirection, normal), 0.0);\n' +
     // Calculate the color due to diffuse reflection
  '  vec3 diffuse = u_LightColor * a_Color.rgb * nDotL;\n' +
     // Calculate the color due to ambient reflection
  '  vec3 ambient = u_AmbientLight * a_Color.rgb;\n' +
     // Add the surface colors due to diffuse reflection and ambient reflection
  '  v_Color = vec4(diffuse + ambient, a_Color.a);\n' +  
  '}\n';

// Fragment shader program
var FSHADER_SOURCE =
  '#ifdef GL_ES\n' +
  'precision mediump float;\n' +
  '#endif\n' +
  'uniform sampler2D u_Texture;\n' +
  'varying vec2 v_TexCoord;\n' +
  'varying vec4 v_Color;\n' +
  'void main() {\n' +
  '  gl_FragColor = texture2D(u_Texture, v_TexCoord);\n' +
  //'  gl_FragColor = v_Color;\n' +
  '}\n';

////////////
/// MAIN ///
////////////

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

  // Array of colors for cube
  var colors1 = new Float32Array([
    1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v0-v1-v2-v3 front
    1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v0-v3-v4-v5 right
    1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v0-v5-v6-v1 up
    1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v1-v6-v7-v2 left
    1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0,     // v7-v4-v3-v2 down
    1, 0, 0,   1, 0, 0,   1, 0, 0,  1, 0, 0　    // v4-v7-v6-v5 back
  ]);

  // Set the clear color and enable the depth test
  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.enable(gl.DEPTH_TEST);

  var program = gl.program;

  // Get the storage locations of attribute variables
  program.a_Position = gl.getAttribLocation(program, 'a_Position');
  program.a_Normal = gl.getAttribLocation(program, 'a_Normal');
  program.a_Color = gl.getAttribLocation(program, 'a_Color');
  program.a_TexCoord = gl.getAttribLocation(program, 'a_TexCoord');

  // Get the storage locations of uniform variables
  program.u_MvpMatrix = gl.getUniformLocation(program, 'u_MvpMatrix');
  program.u_NormalMatrix = gl.getUniformLocation(program, 'u_NormalMatrix');
  program.u_ModelMatrix = gl.getUniformLocation(program, 'u_ModelMatrix');
  program.u_LightColor = gl.getUniformLocation(program, 'u_LightColor');
  program.u_LightPosition = gl.getUniformLocation(program, 'u_LightPosition');
  program.u_AmbientLight = gl.getUniformLocation(program, 'u_AmbientLight');

  if (program.a_Position < 0 ||  program.a_Normal < 0 || program.a_Color < 0 ||
      !program.u_MvpMatrix || !program.u_NormalMatrix || !program.u_ModelMatrix ||
      !program.u_LightColor || !program.u_LightPosition || !program.u_AmbientLight) {
    console.log('Failed to get variable storage location'); 
    return;
  }

  // Set the light color (white)
  gl.uniform3f(program.u_LightColor, 1.0, 1.0, 1.0);
  // Set the light direction (in the world coordinate)
  gl.uniform3f(program.u_LightPosition, 2.3, 4.0, 3.5);
  // Set the ambient light
  gl.uniform3f(program.u_AmbientLight, 0.3, 0.3, 0.3);

  var modelMatrix = new Matrix4();  // Model matrix
  var mvpMatrix = new Matrix4();    // Model view projection matrix
  var normalMatrix = new Matrix4(); // Transformation matrix for normals

  // Calculate the model matrix
  modelMatrix.setRotate(90, 0, 1, 0); // Rotate around the y-axis
  // Pass the model matrix to u_ModelMatrix
  gl.uniformMatrix4fv(program.u_ModelMatrix, false, modelMatrix.elements);

  // Pass the model view projection matrix to u_MvpMatrix
  mvpMatrix.setPerspective(30, canvas.width/canvas.height, 1, 100);
  mvpMatrix.lookAt(20, 20, 20, 0, 0, 0, 0, 1, 0);
  mvpMatrix.multiply(modelMatrix);
  gl.uniformMatrix4fv(program.u_MvpMatrix, false, mvpMatrix.elements);

  // Pass the matrix to transform the normal based on the model matrix to u_NormalMatrix
  normalMatrix.setInverseOf(modelMatrix);
  normalMatrix.transpose();
  gl.uniformMatrix4fv(program.u_NormalMatrix, false, normalMatrix.elements);

  // Set texture
  if (!initTextures(gl)) {
    console.log('Failed to intialize the texture.');
    return;
  }

  // Prepare empty buffer objects for vertex coordinates, colors and normals
  //var OBJmodel = initVertexBuffersOBJ(gl, program);
  var model = initVertexBuffers(gl, colors1, model, 0.79, 0.79, 0.72, 1);

  // Read OBJ file
  readOBJFile("../models/mug.obj", gl, 0.5, true);

  // if (!model || !OBJmodel) {
  //   console.log('Failed to set the vertex information');
  //   return;
  // }
  
  // Draw on each call of tick
  function tick() {
    // Handle key presses
    document.onkeydown = function(ev){ keydown(gl, ev, program, canvas, mvpMatrix, modelMatrix); }

    //drawOBJ(gl, gl.program, mvpMatrix, OBJmodel, 0.79, 0.79, 0.72, 1, -1, 0, 0); // Draw OBJ files, specifying colours and alpha value
    draw(gl, model, mvpMatrix, program.u_MvpMatrix, program.u_NormalMatrix);
    requestAnimationFrame(tick, canvas);

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

  }

  tick();
}

/////////////////
/// FUNCTIONS ///
/////////////////

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
  g_modelMatrix.translate(0, 58, -1.1);
  drawBox(gl, model, 1.2, 7, 0.1, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
  g_modelMatrix = popMatrix(g_modelMatrix);

  // Shade 2
  pushMatrix(g_modelMatrix);
  g_modelMatrix.translate(-1.1, 58, 0);
  drawBox(gl, model, 0.1, 7, 1.2, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
  g_modelMatrix = popMatrix(g_modelMatrix);

  // Shade 3
  pushMatrix(g_modelMatrix);
  g_modelMatrix.translate(0, 58, 1.1);
  drawBox(gl, model, 1.2, 7, 0.1, viewProjMatrix, u_MvpMatrix, u_NormalMatrix);
  g_modelMatrix = popMatrix(g_modelMatrix);

  // Shade 4
  pushMatrix(g_modelMatrix);
  g_modelMatrix.translate(1.1, 58, 0);
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

var g_viewY = 20;
var g_perspX = 30;

var tvOn = false; // Whether TV is on or off
var scale = 0; // Scales objects for animations
var growing = true; // Indicates direction for animations
var beanBagAngle = 35; // Rotation (in degrees) of beanbag
var newBeanBagAngle = 35; // Stores new angle for beanbag animation

// Handle keydown
function keydown(gl, ev, program, canvas, mvpMatrix, modelMatrix) {
  // Handle key input
  if(ev.keyCode == 39) { // The right arrow key was pressed
    rotationAngle = (rotationAngle - 3) % 360;
  } else if (ev.keyCode == 37) { // The left arrow key was pressed
    rotationAngle = (rotationAngle + 3) % 360;
  } else if (ev.keyCode == 38) { // The up arrow key was pressed
    if (g_viewY < 50) {
      g_viewY += 1;
    }
  } else if (ev.keyCode == 40) { // The down arrow key was pressed
    if (g_viewY > 0) {
      g_viewY -= 1; 
    }
  } else if (ev.keyCode == 90) { // Z was pressed
    if (g_perspX > 10) {
      g_perspX -= 1; 
    }
  } else if (ev.keyCode == 88) { // X was pressed
    if (g_perspX < 50) {
      g_perspX += 1;
    }
  } else if (ev.keyCode == 84) { // T was pressed
    tvOn = !tvOn;
  } else if (ev.keyCode == 66) { // B was pressed
    newBeanBagAngle = beanBagAngle + 90;
  } else { return; }

  // Update lookAt with new coordinates
  mvpMatrix.setPerspective(g_perspX, canvas.width/canvas.height, 1, 100);
  mvpMatrix.lookAt(20, g_viewY, 20, 0, 0, 0, 0, 1, 0);
  mvpMatrix.multiply(modelMatrix);
  gl.uniformMatrix4fv(program.u_MvpMatrix, false, mvpMatrix.elements);
}

// Calculate normal
function calcNormal(p0, p1, p2) {
  // v0: a vector from p1 to p0, v1; a vector from p1 to p2
  var v0 = new Float32Array(3);
  var v1 = new Float32Array(3);
  for (var i = 0; i < 3; i++){
    v0[i] = p0[i] - p1[i];
    v1[i] = p2[i] - p1[i];
  }

  // The cross product of v0 and v1
  var c = new Float32Array(3);
  c[0] = v0[1] * v1[2] - v0[2] * v1[1];
  c[1] = v0[2] * v1[0] - v0[0] * v1[2];
  c[2] = v0[0] * v1[1] - v0[1] * v1[0];

  // Normalize the result
  var v = new Vector3(c);
  v.normalize();
  return v.elements;
}

// Create and initialise a buffer object for OBJ files
function initVertexBuffersOBJ(gl, program) {
  var o = new Object(); // Utilise Object object to return multiple buffer objects
  o.vertexBuffer = createEmptyArrayBuffer(gl, program.a_Position, 3, gl.FLOAT);
  o.normalBuffer = createEmptyArrayBuffer(gl, program.a_Normal, 3, gl.FLOAT);
  o.colorBuffer = createEmptyArrayBuffer(gl, program.a_Color, 4, gl.FLOAT);
  o.indexBuffer = gl.createBuffer();

  if (!o.vertexBuffer || !o.normalBuffer || !o.colorBuffer || !o.indexBuffer) return null;

  gl.bindBuffer(gl.ARRAY_BUFFER, null);

  return o;
}

// Create and initialise a buffer object for cubes
function initVertexBuffers(gl, colors, model, r, g, b, a) {

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

  // Write the vertex property to buffers (coordinates, colors and normals)
  if (!initArrayBuffer(gl, 'a_Position', vertices, 3, gl.FLOAT)) return -1;
  if (!initArrayBuffer(gl, 'a_Color', colors, 3, gl.FLOAT)) return -1;
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

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

  return indices.length;
}

// Create a buffer object, assign it to attribute variables, and enable the assignment
function createEmptyArrayBuffer(gl, a_attribute, num, type) {
  var buffer = gl.createBuffer();

  if (!buffer) {
    console.log('Failed to create the buffer object');
    return null;
  }

  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0); // Assign the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_attribute); // Enable the assignment

  return buffer;
}

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
  image12.onload = function(){ loadTextures(gl, u_Texture, images); };

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

// Read an OBJ file
function readOBJFile(fileName, gl, scale, reverse) {
  var request = new XMLHttpRequest();

  request.onreadystatechange = function() {
    if (request.readyState === 4 && request.status !== 404) {
      onReadOBJFile(request.responseText, fileName, gl, scale, reverse);
    }
  }
  request.open('GET', fileName, true); // Create a request to get file
  request.send();

  return;
}

var g_objDoc = null; // The info of OBJ file
var g_drawingInfo = null; // The info for drawing 3D model

// OBJ file has been read
function onReadOBJFile(fileString, fileName, gl, scale, reverse) {
  var objDoc = new OBJDoc(fileName); // Create an OBJDoc object
  var result = objDoc.parse(fileString, scale, reverse); // Parse the file

  if (!result) {
    g_objDoc = null;
    g_drawingInfo = null;
    console.log("OBJ file parsing error.");
    return;
  }
  g_objDoc = objDoc;
}

// Coordinate transformation matrix
var g_modelMatrix = new Matrix4();
var g_mvpMatrix = new Matrix4();
var g_normalMatrix = new Matrix4();

// Draw function
function drawOBJ(gl, program, viewProjMatrix, model, r, g, b, a, x, y, z) {
  if (g_objDoc != null){ // OBJ is available
    g_drawingInfo = onReadComplete(gl, model, g_objDoc, r, g, b, a);
    g_objDoc = null;
  }
  if (!g_drawingInfo) return;   // Determine if model has been loaded

  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);  // Clear color and depth buffers

  // Calculate the normal transformation matrix and pass it to u_NormalMatrix
  g_normalMatrix.setInverseOf(g_modelMatrix);
  g_normalMatrix.transpose();
  gl.uniformMatrix4fv(program.u_NormalMatrix, false, g_normalMatrix.elements);

  // Calculate the model view project matrix and pass it to u_MvpMatrix
  g_mvpMatrix.set(viewProjMatrix);
  g_mvpMatrix.multiply(g_modelMatrix);
  gl.uniformMatrix4fv(program.u_MvpMatrix, false, g_mvpMatrix.elements);

  // Translate and draw object
  g_modelMatrix.setTranslate(x, y, z); // This will work once child of table 
  gl.drawElements(gl.TRIANGLES, g_drawingInfo.indices.length, gl.UNSIGNED_SHORT, 0);
}

// OBJ file has been read completely
function onReadComplete(gl, model, objDoc, r, g, b, a) {
  // Acquire the vertex coordinates and colors from OBJ file
  var drawingInfo = objDoc.getDrawingInfo(r, g, b, a);

  // Write data into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, model.vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.vertices, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, model.normalBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.normals, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ARRAY_BUFFER, model.colorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, drawingInfo.colors, gl.STATIC_DRAW);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indexBuffer);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, drawingInfo.indices, gl.STATIC_DRAW);

  return drawingInfo;
}

///////////////////
// OBJDoc object //
///////////////////

var OBJDoc = function(fileName) {
  this.fileName = fileName;
  this.mtls = new Array(0); // Initialise the property for MTL
  this.objects = new Array(0); // Initialise the property for Object
  this.vertices = new Array(0); // Initialise the property for Vertex
  this.normals = new Array(0); // Initialise the property for Normal
  this.textureVertices = new Array(0); // Initialise the property for Texture Vertices
}

// Parsing the OBJ file
OBJDoc.prototype.parse = function(fileString, scale, reverse) {
  var lines = fileString.split('\n'); // Break up into lines
  lines.push(null); // Append null
  var index = 0; // Initialise index of line

  var currentObject = null;
  var currentMaterialName = "";

  // Parse line by line
  var line; // A string in the line to be parsed
  var sp = new StringParser(); // Create StringParser

  while ((line = lines[index++]) != null) {
    sp.init(line); // init StringParser
    var command = sp.getWord(); // Get command
    if (command == null) continue; // check null command

    switch(command) {
      case '#':
        continue; // Skip comments
      case 'mtllib': // Read Material chunk
        var path = this.parseMtllib(sp, this.fileName);
        var mtl = new MTLDoc(); // Create MTL instance
        this.mtls.push(mtl);
        var request = new XMLHttpRequest();
        request.onreadystatechange = function() {
          if (request.readyState == 4) {
            if (request.status != 404) {
              onReadMTLFile(request.responseText, mtl);
            } else {
              mtl.complete = true;
            }
          }
        }
        request.open('GET', path, true); // Create a request to get file
        request.send(); // Send the request
        continue; // Go to the next line
      case 'o':
      case 'g': // Read Object name
        var object = this.parseObjectName(sp);
        this.objects.push(object);
        currentObject = object;
        continue; // Go to the next line
      case 'v': // Read vertex
        var vertex = this.parseVertex(sp, scale);
        this.vertices.push(vertex);
        continue; // Go to the next line
      case 'vn': // Read normal
        var normal = this.parseNormal(sp);
        this.normals.push(normal);
        continue; // Go to the next line
      case 'vt': // Read texture vertices
        var textureVertex = this.parseTextureVertex(sp, scale);
        this.textureVertices.push(textureVertex);
        continue; // Go to the next line
      case 'usemtl': // Read Material name
        currentMaterialName = this.parseUsemtl(sp);
        continue; // Go to the next line
      case 'f': // Read face
        var face = this.parseFace(sp, currentMaterialName, this.vertices, false);
        currentObject.addFace(face);
        continue; // Go to the next line
    }
  }

  return true;
}

OBJDoc.prototype.parseMtllib = function(sp, fileName) {
  // Get directory path
  var i = fileName.lastIndexOf("/");
  var dirPath = "";
  if(i > 0) dirPath = fileName.substr(0, i+1);
  return dirPath + sp.getWord();   // Get path
}

OBJDoc.prototype.parseObjectName = function(sp) {
  var name = sp.getWord();
  return (new OBJObject(name));
}

OBJDoc.prototype.parseVertex = function(sp, scale) {
  var x = sp.getFloat() * scale;
  var y = sp.getFloat() * scale;
  var z = sp.getFloat() * scale;
  return (new Vertex(x, y, z));
}

OBJDoc.prototype.parseTextureVertex = function(sp, scale) {
  var x = sp.getFloat() * scale;
  var y = sp.getFloat() * scale;
  return (new TextureVertex(x, y));
}

OBJDoc.prototype.parseNormal = function(sp) {
  var x = sp.getFloat();
  var y = sp.getFloat();
  var z = sp.getFloat();
  return (new Normal(x, y, z));
}

OBJDoc.prototype.parseUsemtl = function(sp) {
  return sp.getWord();
}

OBJDoc.prototype.parseFace = function(sp, materialName, vertices, reverse) {  
  var face = new Face(materialName);
  // get indices
  for(;;){
    var word = sp.getWord();
    if(word == null) break;
    var subWords = word.split('/');
    if(subWords.length >= 1){
      var vi = parseInt(subWords[0]) - 1;
      face.vIndices.push(vi);
    }
    if(subWords.length >= 3){
      var ni = parseInt(subWords[2]) - 1;
      face.nIndices.push(ni);
    }else{
      face.nIndices.push(-1);
    }
  }

  // calc normal
  var v0 = [
    vertices[face.vIndices[0]].x,
    vertices[face.vIndices[0]].y,
    vertices[face.vIndices[0]].z];
  var v1 = [
    vertices[face.vIndices[1]].x,
    vertices[face.vIndices[1]].y,
    vertices[face.vIndices[1]].z];
  var v2 = [
    vertices[face.vIndices[2]].x,
    vertices[face.vIndices[2]].y,
    vertices[face.vIndices[2]].z];

  // Calculate surface normal and set to normal
  var normal = calcNormal(v0, v1, v2);
  // Find out if the normal was found correctly
  if (normal == null) {
    if (face.vIndices.length >= 4) { // Calculated normal with another combination of three points
      var v3 = [
        vertices[face.vIndices[3]].x,
        vertices[face.vIndices[3]].y,
        vertices[face.vIndices[3]].z];
      normal = calcNormal(v1, v2, v3);
    }
    if(normal == null){         // Use the normal in the Y-axis direction
      normal = [0.0, 1.0, 0.0];
    }
  }
  if(reverse){
    normal[0] = -normal[0];
    normal[1] = -normal[1];
    normal[2] = -normal[2];
  }
  face.normal = new Normal(normal[0], normal[1], normal[2]);

  // Divide to triangles if face contains more than 3 points.
  if(face.vIndices.length > 3){
    var n = face.vIndices.length - 2;
    var newVIndices = new Array(n * 3);
    var newNIndices = new Array(n * 3);
    for(var i=0; i<n; i++){
      newVIndices[i * 3 + 0] = face.vIndices[0];
      newVIndices[i * 3 + 1] = face.vIndices[i + 1];
      newVIndices[i * 3 + 2] = face.vIndices[i + 2];
      newNIndices[i * 3 + 0] = face.nIndices[0];
      newNIndices[i * 3 + 1] = face.nIndices[i + 1];
      newNIndices[i * 3 + 2] = face.nIndices[i + 2];
    }
    face.vIndices = newVIndices;
    face.nIndices = newNIndices;
  }
  face.numIndices = face.vIndices.length;

  return face;
}

// Analyze the material file
function onReadMTLFile(fileString, mtl) {
  var lines = fileString.split('\n');  // Break up into lines and store them as array
  lines.push(null);           // Append null
  var index = 0;              // Initialize index of line

  // Parse line by line
  var line;      // A string in the line to be parsed
  var name = ""; // Material name
  var sp = new StringParser();  // Create StringParser
  while ((line = lines[index++]) != null) {
    sp.init(line);                  // init StringParser
    var command = sp.getWord();     // Get command
    if(command == null)	 continue;  // check null command

    switch(command){
    case '#':
      continue;    // Skip comments
    case 'newmtl': // Read Material chunk
      name = mtl.parseNewmtl(sp);    // Get name
      continue; // Go to the next line
    case 'Kd':   // Read normal
      if(name == "") continue; // Go to the next line because of Error
      var material = mtl.parseRGB(sp, name);
      mtl.materials.push(material);
      name = "";
      continue; // Go to the next line
    }
  }
  mtl.complete = true;
}

// Check Materials
OBJDoc.prototype.isMTLComplete = function() {
  if(this.mtls.length == 0) return true;
  for(var i = 0; i < this.mtls.length; i++){
    if(!this.mtls[i].complete) return false;
  }
  return true;
}

// Find color by material name
OBJDoc.prototype.findColor = function(name){
  for(var i = 0; i < this.mtls.length; i++){
    for(var j = 0; j < this.mtls[i].materials.length; j++){
      if(this.mtls[i].materials[j].name == name){
        return(this.mtls[i].materials[j].color)
      }
    }
  }
  return(new Color(0.8, 0.8, 0.8, 1));
}

OBJDoc.prototype.getDrawingInfo = function(r, g, b, a) {
  // Create an array for vertex coordinates, normals, colors, and indices
  var numIndices = 0;
  for (var i = 0; i < this.objects.length; i++) {
    numIndices += this.objects[i].numIndices;
  }
  var numVertices = numIndices;
  var vertices = new Float32Array(numVertices * 3);
  var normals = new Float32Array(numVertices * 3);
  var colors = new Float32Array(numVertices * 4);
  var indices = new Uint16Array(numIndices);

  // Set vertex, normal and color
  var index_indices = 0;
  for (var i = 0; i < this.objects.length; i++) {
    var object = this.objects[i];
    for (var j = 0; j < object.faces.length; j++) {
      var face = object.faces[j];
      var color = this.findColor(face.materialName);
      var faceNormal = face.normal;
      for (var k = 0; k < face.vIndices.length; k++) {
        // Set index
        indices[index_indices] = index_indices;
        // Copy vertex
        var vIdx = face.vIndices[k];
        var vertex = this.vertices[vIdx];
        vertices[index_indices * 3 + 0] = vertex.x;
        vertices[index_indices * 3 + 1] = vertex.y;
        vertices[index_indices * 3 + 2] = vertex.z;
        // Copy color
        colors[index_indices * 4 + 0] = r;
        colors[index_indices * 4 + 1] = g;
        colors[index_indices * 4 + 2] = b;
        colors[index_indices * 4 + 3] = a;
        // Copy normal
        var nIdx = face.nIndices[k];
        if (nIdx >= 0) {
          var normal = this.normals[nIdx];
          normals[index_indices * 3 + 0] = normal.x;
          normals[index_indices * 3 + 1] = normal.y;
          normals[index_indices * 3 + 2] = normal.z;
        } else {
          normals[index_indices * 3 + 0] = faceNormal.x;
          normals[index_indices * 3 + 1] = faceNormal.y;
          normals[index_indices * 3 + 2] = faceNormal.z;
        }
        index_indices++;
      }
    }
  }

  return new DrawingInfo(vertices, normals, colors, indices);
}

///////////////////
// MTLDoc Object //
///////////////////

var MTLDoc = function() {
  this.complete = false; // MTL is configured correctly
  this.materials = new Array(0);
}

MTLDoc.prototype.parseNewmtl = function(sp) {
  return sp.getWord();         // Get name
}

MTLDoc.prototype.parseRGB = function(sp, name) {
  var r = sp.getFloat();
  var g = sp.getFloat();
  var b = sp.getFloat();
  return (new Material(name, r, g, b, 1));
}

/////////////////////
// Material Object //
/////////////////////

var Material = function(name, r, g, b, a) {
  this.name = name;
  this.color = new Color(r, g, b, a);
}

///////////////////
// Vertex Object //
///////////////////

var Vertex = function(x, y, z) {
  this.x = x;
  this.y = y;
  this.z = z;
}

///////////////////////////
// Texture Vertex Object //
///////////////////////////

var TextureVertex = function(x, y) {
  this.x = x;
  this.y = y;
}

///////////////////
// Normal Object //
///////////////////

var Normal = function(x, y, z) {
  this.x = x;
  this.y = y;
  this.z = z;
}


///////////////////
// Color Object //
///////////////////

var Color = function(r, g, b, a) {
  this.r = r;
  this.g = g;
  this.b = b;
  this.a = a;
}

//////////////////////
// OBJObject Object //
//////////////////////

var OBJObject = function(name) {
  this.name = name;
  this.faces = new Array(0);
  this.numIndices = 0;
}

OBJObject.prototype.addFace = function(face) {
  this.faces.push(face);
  this.numIndices += face.numIndices;
}

/////////////////
// Face Object //
/////////////////

var Face = function(materialName) {
  this.materialName = materialName;
  if(materialName == null)  this.materialName = "";
  this.vIndices = new Array(0);
  this.nIndices = new Array(0);
}

/////////////////////
// DrawInfo Object //
/////////////////////

var DrawingInfo = function(vertices, normals, colors, indices) {
  this.vertices = vertices;
  this.normals = normals;
  this.colors = colors;
  this.indices = indices;
}

/////////////////////////
// StringParser Object //
/////////////////////////

var StringParser = function(str) {
  this.str;   // Store the string specified by the argument
  this.index; // Position in the string to be processed
  this.init(str);
}
// Initialize StringParser object
StringParser.prototype.init = function(str){
  this.str = str;
  this.index = 0;
}

// Skip delimiters
StringParser.prototype.skipDelimiters = function()  {
  for(var i = this.index, len = this.str.length; i < len; i++){
    var c = this.str.charAt(i);
    // Skip TAB, Space, '(', ')
    if (c == '\t'|| c == ' ' || c == '(' || c == ')' || c == '"') continue;
    break;
  }
  this.index = i;
}

// Skip to the next word
StringParser.prototype.skipToNextWord = function() {
  this.skipDelimiters();
  var n = getWordLength(this.str, this.index);
  this.index += (n + 1);
}

// Get word
StringParser.prototype.getWord = function() {
  this.skipDelimiters();
  var n = getWordLength(this.str, this.index);
  if (n == 0) return null;
  var word = this.str.substr(this.index, n);
  this.index += (n + 1);

  return word;
}

// Get integer
StringParser.prototype.getInt = function() {
  return parseInt(this.getWord());
}

// Get floating number
StringParser.prototype.getFloat = function() {
  return parseFloat(this.getWord());
}

// Get the length of word
function getWordLength(str, start) {
  var n = 0;
  for(var i = start, len = str.length; i < len; i++){
    var c = str.charAt(i);
    if (c == '\t'|| c == ' ' || c == '(' || c == ')' || c == '"') 
	break;
  }
  return i - start;
}
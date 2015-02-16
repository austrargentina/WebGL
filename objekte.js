//Copyright by MC Daniel Bracher
//Tickets available nowhere
//(that crowd goes woopwoop)

function BasicModel(){
	this.itemSize;				//Anzahl der Einheiten, die ein Item beinhaltet(= 3 koordianten in diesem Fall)
	this.numItems;				//Anzahl der Items (= anzahl der koordinaten)
	this.indexNumItems;			//Anzahl der Indices
	this.withIndices;			//ob mit indices gezeichnet wird
	this.vertices = [];			//Array fuer die Vertices	
	this.colors = [];			//Array fuer die Farben (fuer jede Koordinate eine)
	this.indices = [];			//Array fuer die Indizes
	this.vertexNormals = [];	//Array fuer die Normalen der Vertize
	this.position_buffer;		//Buffer für die Koordinaten (vertize)		
	this.color_buffer;			//Buffer für die Farben
	this.index_buffer; 			//Buffer für die indices
	this.vertexNormals_buffer;	//Buffer für die vertex normals
	this.drawMethod;			//Zeichenart (triangle, trianglestrip,...)
	this.rotation = 0;			//drehung in grad
	this.rotation_axis = [0,1,0];	//achse, um die sich objekt dreht
	this.translation = [0.0,0.0,0.0]; //translations-koordinaten
	
	this.initBuffer = function(){
		//Buffer für Objekt erzeugen
		this.position_buffer = this.createBuffer(this.vertices, "float");	
		//Buffer für Farben erzeugen
		this.color_buffer = this.createBuffer(this.colors, "float");
		
		if(this.withIndices === true){
			this.index_buffer = this.createBuffer(this.indices, "int");
		}
		
		this.vertexNormals_buffer = this.createBuffer(this.vertexNormals, "float");
	};
	
	this.createBuffer = function(data_array, bufferType){
		if(bufferType ===  "float"){
			//Buffer erzeugen
			var buffer = gl.createBuffer();
			//Erzeugten Buffer in Grafikakrte laden
			gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
			//Float32Array (für Umwandlung von JS in WEbGL)
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data_array), gl.STATIC_DRAW);
			//Anzahl der Spalten
			buffer.itemSize = this.itemSize;
			//Anzahl der Zeilen
			buffer.numItems = this.numItems;
			//Buffer zurückgeben
			return buffer;
		}else if(bufferType === "int"){	//Wenn cube	
			var buffer = gl.createBuffer();	
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data_array), gl.STATIC_DRAW);
			buffer.itemSize = 1;
			buffer.numItems = this.indexNumItems;
			return buffer;
		}
	}
	
	this.drawObject = function(){
		mvPushMatrix();
		
		//Verschieben des Objekts 
		mat4.translate(mvMatrix, this.translation);
		
		//Drehen des Objekts
		mat4.rotate(mvMatrix, this.rotation * Math.PI / 180, this.rotation_axis ); //Umrechnung in Radianten; [0,1,0] Achse, um die sich das ganze dreht 
		
		//Zeichnen des Objekts 
		gl.bindBuffer(gl.ARRAY_BUFFER, this.position_buffer);
		gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, this.position_buffer.itemSize, gl.FLOAT, false, 0, 0);
		
		//Farben hinzufügen
		gl.bindBuffer(gl.ARRAY_BUFFER, this.color_buffer);
		gl.vertexAttribPointer(shaderProgram.vertexColorAttribute, 4, gl.FLOAT, false, 0, 0);
		
		//Vertex-Normalen hinzufügen
		gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexNormal_buffer);
		gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, this.vertexNormals_buffer.itemSize, gl.FLOAT, false, 0, 0);
		
		var lighting = true;
        gl.uniform1i(shaderProgram.useLightingUniform, lighting);
		
        if (lighting) {
			//Ambient-Lighting
            gl.uniform3f(
				shaderProgram.ambientColorUniform,
				parseFloat(document.getElementById("ambientR").value),
				parseFloat(document.getElementById("ambientG").value),
				parseFloat(document.getElementById("ambientB").value)
			);
			
			//Richtung, aus der das Licht kommt
            var lightingDirection = [
				parseFloat(document.getElementById("lightDirectionX").value),
				parseFloat(document.getElementById("lightDirectionY").value),
				parseFloat(document.getElementById("lightDirectionZ").value)
			];
            var adjustedLD = vec3.create();
            vec3.normalize(lightingDirection, adjustedLD);
            vec3.scale(adjustedLD, -1);
            gl.uniform3fv(shaderProgram.lightingDirectionUniform, adjustedLD);

			//Directional-Lighting
            gl.uniform3f(
				shaderProgram.directionalColorUniform,
				parseFloat(document.getElementById("directionalR").value),
				parseFloat(document.getElementById("directionalG").value),
				parseFloat(document.getElementById("directionalB").value)
			);
        }
		
		//Indize hinzufügen (nur für Cube)
		if(this.withIndices === true){ //hinzufügen eines index buffers für die indices-objekte
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.index_buffer);
		}
		
		//WebGL sagesn, die model-View-Matrix übernehmen
		setMatrixUniforms();
		
		//Zeichnen des Objekts
		if(this.withIndices === false){ //Falls kein Index-Objekt ist
			gl.drawArrays(this.drawMethod, 0, this.position_buffer.numItems);
		}else{
			gl.drawElements(this.drawMethod, this.index_buffer.numItems, gl.UNSIGNED_SHORT, 0);
		}

		mvPopMatrix();
	}
	
		
	this.scale = function(skalierung){		
		//Skalierung
		var skalierung = (typeof skalierung !== "undefined" && skalierung !== null) ? skalierung : 1;
		for(var i = 0; i < this.vertices.length; i++){
			this.vertices[i] *= skalierung;
		}
	}
	
	this.rotate = function(rotation){
		//Rotation
		if(typeof rotation !== "undefined" && rotation !== null){
			if(typeof rotation === "number"){ //Falls nur Winkel (ohne Rotationsachse) angegeben wurde 
				this.rotation += rotation;
			}else{
				this.rotation += (typeof rotation[0] !== "undefined" && rotation[0] !== null) ? rotation[0]: this.rotation;
				this.rotation_axis = (typeof rotation[1] !== "undefined" && rotation[1] !== null) ? rotation[1]: this.rotation_axis;
			}
		}	
	}
	
	this.translate = function(translation){
		//Um Bug aus dem Weg zu räumen
		help = [translation[0] + this.translation[0], translation[1] + this.translation[1], translation[2] + this.translation[2]];
		this.translation = help;
		
		/*
		//Translation, die die Koordinaten ändert
		var translation = (typeof translation !== "undefined" && translation !== null) ? translation : [0,0,0];
		for(var i = 0; i < this.vertices.length; i++){
			switch(i%3){
				case 0:	this.vertices[i] += translation[0]; break;
				case 1:	this.vertices[i] += translation[1]; break;
				case 2: this.vertices[i] += translation[2]; break;
			}
		}
		this.position_buffer = this.createBuffer(this.vertices, "float"); //positionen aktualisieren aktualisieren*/
	}
}

/*********************
		CONE
**********************/
function Cone(hoehe, radius, unterteilungen, vertices, colors, indices){	
	var hoehe = (typeof hoehe === "undefined" || hoehe === null) ? 1 : hoehe; //Falls Hoehe nicht gegeben, auf 1 setzen, ansonsten hoehe
	var radius = (typeof radius === "undefined" || radius === null) ? 1 : radius; //Falls radius nicht gegeben, auf 1 setzen, ansonsten radius
	var unterteilungen = (typeof unterteilungen === "undefined" || unterteilungen === null) ? 20 : unterteilungen; //Falls unterteilungen nicht gegeben, auf 4 setzen, ansonsten unterteilungen

	this.withIndices = true;
	this.drawMethod = gl.TRIANGLES;
	this.itemSize = 3;	//eine koordinate hat 3 zahlen
	
	//Zuruecksetzen
	this.vertices = [];	
	this.colors = [];
	this.indices = [];
			
	var deg_rad = Math.PI / 180; //Umwandler von Grad in Radianten (fuer Winkelsaetze spaeter)
	
	if(typeof vertices === 'undefined' || vertices === null){
		
		for(var i = 1; i <= unterteilungen; i++){		
			var alpha = i * 360/unterteilungen * deg_rad; //nimmt den winkel im kreis an
			var x = Math.cos(alpha) * radius;	//Winkelsummensatz im Einheitskreis fuer die x koordinate
			var z = Math.sin(alpha) * radius;	//Winkelsummensatz im Einheitskreis fuer die z koordinate (die im 2D-Raum eigentlich y waere)
			
			oben = [0,hoehe,0];	//oberster Punkt
			links = [x,0,z];		//punkt links unten
			
			i++;	//Fuer naechsten punkt im 'Kreis'
			
			var alpha = i * 360/unterteilungen * deg_rad; //nimmt den winkel im kreis an
			var x = Math.cos(alpha) * radius;	//Winkelsummensatz im Einheitskreis fuer die x koordinate
			var z = Math.sin(alpha) * radius;	//Winkelsummensatz im Einheitskreis fuer die z koordinate (die im 2D-Raum eigentlich y waere)
			
			rechts = [x,0,z];		//punkt rechts unten
			unten = [0,0,0];		//unterster punkt
			
			//in vertices einfuegen
			this.vertices = this.vertices.concat(oben);
			this.vertices = this.vertices.concat(links);
			this.vertices = this.vertices.concat(rechts);
			this.vertices = this.vertices.concat(links);
			this.vertices = this.vertices.concat(rechts);
			this.vertices = this.vertices.concat(unten);
			
			i--;	//zuruecksetzen, damit naechster wieder der selbe ist
		}
	}else{
		this.vertices = vertices;
	}
	
	this.numItems = this.vertices.length/3;
		
	if(typeof colors === 'undefined' || colors === null){
		for(var i = 0; i < this.numItems; i++){
			this.colors.push(Math.random(), Math.random(), Math.random(), 1);
		}
	}else{
		this.colors = colors;
	}
	
	if(typeof indices === 'undefined' || indices === null){
		for(var i = 0; i < this.numItems; i++){			
			this.indices.push(i);
		}
	}else{
		this.indices = indices;
	}	 
	
	this.indexNumItems = this.indices.length;
}
Cone.prototype = new BasicModel(); //Vererbung von BasicModel

/*********************
		PYRAMID
**********************/
function Pyramid(hoehe, vertices, colors, indices){
	return new Cone(hoehe,1,4,vertices,colors,indices);
}
Pyramid.prototype = new BasicModel(); //Vererbung von BasicModel

/*********************
		CUBE
**********************/
function Cube(breite, hoehe, tiefe, vertices, colors, indices, normals){
	var breite = (typeof breite === "undefined" || breite === null) ? 2 : breite; //Falls breite nicht gegeben, auf 1 setzen, ansonsten breite
	var hoehe = (typeof hoehe === "undefined" || hoehe === null) ? 2 : hoehe; //Falls Hoehe nicht gegeben, auf 1 setzen, ansonsten hoehe
	var tiefe = (typeof tiefe === "undefined" || tiefe === null) ? 2 : tiefe; //Falls tiefe nicht gegeben, auf 4 setzen, ansonsten tiefe

	this.withIndices = true;
	this.drawMethod = gl.TRIANGLES;
	this.itemSize = 3;	//eine koordinate hat 3 zahlen
	
	this.indices = [];	//Um bug auszuräumen
	this.colors = [];	//		-||-
	this.vertices = [];	//		-||-
	this.vertexNormals = [];
				
	if(typeof vertices === 'undefined' || vertices === null){
		//Vordere flaeche
		this.vertices.push(-breite/2,hoehe/2,tiefe/2)
		this.vertices.push(breite/2, hoehe/2,tiefe/2)
		this.vertices.push(-breite/2,-hoehe/2,tiefe/2)
		this.vertices.push(breite/2, -hoehe/2,tiefe/2)
		
		//Rechte flaeche
		this.vertices.push(breite/2, hoehe/2,tiefe/2)
		this.vertices.push(breite/2, hoehe/2,-tiefe/2)
		this.vertices.push(breite/2, -hoehe/2,tiefe/2)
		this.vertices.push(breite/2, -hoehe/2,-tiefe/2)
		
		//Hintere flaeche
		this.vertices.push(breite/2, hoehe/2,-tiefe/2)
		this.vertices.push(-breite/2,hoehe/2,-tiefe/2)
		this.vertices.push(breite/2, -hoehe/2,-tiefe/2)
		this.vertices.push(-breite/2,-hoehe/2,-tiefe/2)
		
		//Linke flaeche
		this.vertices.push(-breite/2,hoehe/2,-tiefe/2)
		this.vertices.push(-breite/2,hoehe/2,tiefe/2)
		this.vertices.push(-breite/2,-hoehe/2,-tiefe/2)
		this.vertices.push(-breite/2,-hoehe/2,tiefe/2)

		//Obere flaeche
		this.vertices.push(-breite/2,hoehe/2,tiefe/2);	//vornelinks
		this.vertices.push(breite/2, hoehe/2,tiefe/2);	//vornerechts	
		this.vertices.push(breite/2, hoehe/2,-tiefe/2);	//hintenrechts
		this.vertices.push(-breite/2,hoehe/2,-tiefe/2);	//hintenlinks
		
		//Untere flaeche
		this.vertices.push(-breite/2,-hoehe/2,tiefe/2);	//vornelinks
		this.vertices.push(breite/2, -hoehe/2,tiefe/2);	//vornerechts	
		this.vertices.push(breite/2, -hoehe/2,-tiefe/2);	//hintenrechts
		this.vertices.push(-breite/2,-hoehe/2,-tiefe/2);	//hintenlinks
		
	}else{
		this.vertices = vertices;
	}
	
	this.numItems = this.vertices.length/3;
		
	if(typeof colors === 'undefined' || colors === null){
		for(var i = 0; i < this.numItems; i++){
			this.colors.push(Math.random(), Math.random(), Math.random(), 1);
		}
	}else{
		this.colors = colors;
	}
	
	if(typeof indices === 'undefined' || indices === null){
		//Fuer setilichen faces
		for(var i = 0; i < this.numItems - 2*4; i += 4){			
			this.indices.push(i,i+1,i+2);	
			this.indices.push(i+1,i+2,i+3);
		}
		this.indices.push(16,17,18,		16,18,19);	//oberes face
		this.indices.push(20,21,22,		20,22,23);	//unteres face
	}else{
		this.indices = indices;
	}	 
	
	this.indexNumItems = this.indices.length;
	
	if(typeof normals === 'undefined' || normals === null){
		this.vertexNormals = [
			//Vordere flaeche
			0.0,  0.0,  1.0,
			0.0,  0.0,  1.0,
			0.0,  0.0,  1.0,
			0.0,  0.0,  1.0,
			
			// Rechte flaeche
			1.0,  0.0,  0.0,
			1.0,  0.0,  0.0,
			1.0,  0.0,  0.0,
			1.0,  0.0,  0.0,

			// Hintere flaeche
			0.0,  0.0, -1.0,
			0.0,  0.0, -1.0,
			0.0,  0.0, -1.0,
			0.0,  0.0, -1.0,

			// Linke flaeche
			-1.0,  0.0,  0.0,
			-1.0,  0.0,  0.0,
			-1.0,  0.0,  0.0,
			-1.0,  0.0,  0.0,

			// Obere flaeche
			0.0,  1.0,  0.0,
			0.0,  1.0,  0.0,
			0.0,  1.0,  0.0,
			0.0,  1.0,  0.0,

			// Untere flaeche
			0.0, -1.0,  0.0,
			0.0, -1.0,  0.0,
			0.0, -1.0,  0.0,
			0.0, -1.0,  0.0
		];
	}else{
		this.vertexNormals = normals;
	}
}
Cube.prototype = new BasicModel(); //Vererbung von BasicModel

/*********************
		CYLINDER
**********************/
function Cylinder(hoehe, radius, unterteilungen, vertices, colors, indices){
	var hoehe = (typeof hoehe === "undefined" || hoehe === null) ? 1 : hoehe; //Falls Hoehe nicht gegeben, auf 1 setzen, ansonsten hoehe
	var radius = (typeof radius === "undefined" || radius === null) ? 1 : radius; //Falls radius nicht gegeben, auf 1 setzen, ansonsten radius
	var unterteilungen = (typeof unterteilungen === "undefined" || unterteilungen === null) ? 20 : unterteilungen; //Falls unterteilungen nicht gegeben, auf 4 setzen, ansonsten unterteilungen

	this.withIndices = true;
	this.drawMethod = gl.TRIANGLES;
	this.itemSize = 3;	//eine koordinate hat 3 zahlen
			
	var deg_rad = Math.PI / 180; //Umwandler von Grad in Radianten (fuer Winkelsaetze spaeter)
	
	if(typeof vertices === 'undefined' || vertices === null){
		
		for(var i = 1; i <= unterteilungen; i++){
			var alpha = i * 360/unterteilungen * deg_rad; //nimmt den winkel im kreis an
			var x = Math.cos(alpha) * radius;	//Winkelsummensatz im Einheitskreis fuer die x koordinate
			var z = Math.sin(alpha) * radius;	//Winkelsummensatz im Einheitskreis fuer die z koordinate (die im 2D-Raum eigentlich y waere)
			
			oben = [0,hoehe,0];				//oberer mittlerer Punkt
			linksoben = [x,hoehe,z];		//punkt links oben
			linksunten = [x,0,z];			//punkt links unten
			
			i++;	//Fuer naechsten punkt im 'Kreis'
			
			var alpha = i * 360/unterteilungen * deg_rad; //nimmt den winkel im kreis an
			var x = Math.cos(alpha) * radius;	//Winkelsummensatz im Einheitskreis fuer die x koordinate
			var z = Math.sin(alpha) * radius;	//Winkelsummensatz im Einheitskreis fuer die z koordinate (die im 2D-Raum eigentlich y waere)
			
			rechtsoben = [x,hoehe,z];		//punkt rechts oben
			rechtsunten = [x,0,z];		//punkt rechts unten
			unten = [0,0,0];		//unterer mittlerer punkt
			
			//oberes face
			this.vertices = this.vertices.concat(oben);
			this.vertices = this.vertices.concat(linksoben);
			this.vertices = this.vertices.concat(rechtsoben);
			
			//seitenface
			this.vertices = this.vertices.concat(linksoben);
			this.vertices = this.vertices.concat(rechtsoben);
			this.vertices = this.vertices.concat(linksunten);
			this.vertices = this.vertices.concat(rechtsunten);
			
			//Unteres face
			this.vertices = this.vertices.concat(linksunten);
			this.vertices = this.vertices.concat(rechtsunten);
			this.vertices = this.vertices.concat(unten);
			
			i--;	//zuruecksetzen, damit naechster wieder der selbe ist
		}
	}else{
		this.vertices = vertices;
	}
	
	this.numItems = this.vertices.length/3;
		
	if(typeof colors === 'undefined' || colors === null){
		for(var i = 0; i < this.numItems; i++){
			this.colors.push(Math.random(), Math.random(), Math.random(), 1);
		}
	}else{
		this.colors = colors;
	}
	
	if(typeof indices === 'undefined' || indices === null){
		for(var i = 0; i < this.numItems; i += 10){			
			this.indices.push(i,i+1,i+2); //oberes face	
			
			//seitliches face
			this.indices.push(i+3,i+4,i+5);
			this.indices.push(i+4,i+5,i+6);
			
			this.indices.push(i+7,i+8,i+9); //unteres face	
		}
	}else{
		this.indices = indices;
	}	 
	
	this.indexNumItems = this.indices.length;
}
Cylinder.prototype = new BasicModel(); //Vererbung von BasicModel

/*********************
		SPHERE
**********************/
function Sphere(radius, vertices, colors, indices){
	var radius = (typeof radius === "undefined" || radius === null) ? 1 : radius; //Falls radius nicht gegeben, auf 1 setzen, ansonsten radius	
	var latitudeBands = 50;
	var longitudeBands = 50;
	
	this.withIndices = true;
	this.drawMethod = gl.TRIANGLES;
	this.itemSize = 3;	//eine koordinate hat 3 zahlen
	
	this.indices = [];	//Um bug auszuräumen
	this.colors = [];	//		-||-
	this.vertices = [];	//		-||-
			
	if(typeof vertices === 'undefined' || vertices === null){
		
		for (var latNumber = 0; latNumber <= latitudeBands; latNumber++) {
			var theta = latNumber * Math.PI / latitudeBands;
			var sinTheta = Math.sin(theta);
			var cosTheta = Math.cos(theta);

			for (var longNumber = 0; longNumber <= longitudeBands; longNumber++) {
				var phi = longNumber * 2 * Math.PI / longitudeBands;
				var sinPhi = Math.sin(phi);
				var cosPhi = Math.cos(phi);

				var x = radius * cosPhi * sinTheta;
				var y = radius * cosTheta;
				var z = radius * sinPhi * sinTheta;

				this.vertices.push(x, y, z);
			}
		}
	}else{
		this.vertices = vertices;
	}
	
	this.numItems = this.vertices.length/3;
		
	if(typeof colors === 'undefined' || colors === null){
		for(var i = 0; i < this.numItems; i++){
			this.colors.push(Math.random(), Math.random(), Math.random(), 1);
		}
	}else{
		this.colors = colors;
	}
	
	if(typeof indices === 'undefined' || indices === null){
		for (var latNumber = 0; latNumber < latitudeBands; latNumber++) {
			for (var longNumber = 0; longNumber < longitudeBands; longNumber++) {
				var first = (latNumber * (longitudeBands + 1)) + longNumber;
				var second = first + longitudeBands + 1;
				
				this.indices.push(first, second, first + 1);
				this.indices.push(second, second +1 , first +1);
			}
		}	
	}else{
		this.indices = indices;
	}	 
	
	this.indexNumItems = this.indices.length;
}
Sphere.prototype = new BasicModel(); //Vererbung von BasicModel


/*********************
		SQUARE
**********************/
function Square(vertices, colors){
	this.withIndices = false;
	this.itemSize = 3;
	this.numItems = 4;
	
	//PreSets einrichten
	if(typeof vertices === 'undefined' || vertices === null){
		this.vertices = [
			1.0,  1.0,  0.0,
			-1.0,  1.0,  0.0,
			 1.0, -1.0,  0.0,
			-1.0, -1.0,  0.0
		];
	}else{
		this.vertices = vertices;
	}
		
	if(typeof colors === 'undefined' || colors === null){
		this.colors = [
			0.3, 0.9, 1.0, 1.0,
			1.0, 0.9, 0.1, 1.0,
			0.3, 1.0, 0.1, 1.0,
			1.0, 0.1, 0.1, 1.0,
		];
	}else{
		this.colors = colors;
	}
}
Square.prototype = new BasicModel(); //Vererbung von BasicModel

/*********************
		TRIANGLE
**********************/
function Triangle(vertices, colors){
	return new Cone(null,null,2, vertices, colors);
}
Triangle.prototype = new BasicModel(); //Vererbung von BasicModel

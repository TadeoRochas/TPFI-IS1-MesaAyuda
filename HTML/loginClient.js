const formE1 = document.querySelector('.form');

/*---
    Intercepta el submit del formulario
    */

formE1.addEventListener('submit', (event) => {
	event.preventDefault();
	const formData = new FormData(formE1);


	const data = Object.fromEntries(formData);
	console.log('Application Server: Revisa el valor del form:');
	
	//Punto del práctico, no exponer la password en los textos claros.
	// No usamos esto ya que expone la password
	// console.log(data);
	// Usamos esto en su lugar para mostrar todo menos la password.
	console.log({ contacto: data.contacto, password: '[Censurado]' });

	/*---
        Realiza validaciones en los datos del formulario antes de procesar
        */

	if (data.contacto == '' || data.password == '') {
		console.log('debe indicar contacto');
		document.getElementById('resultado1').style.color = 'RED';
		document.getElementById('resultado1').style.textAlign = 'center';
		document.getElementById('resultado1').textContent =
			'Debe informar correo y password para  completar el acceso';
		return;
	}

	if (data.contacto == 'pec') {   /*--Fix hecho por  Germán Lombardi IS1-2025 */
		console.log('pec no es bienvenido en éste sistema');
		const m = '<li>El usuario <pec> no es bienvenido en éste sistema</li>';
		document.getElementById('resultado2').style.color = 'RED';
		document.getElementById('resultado2').style.textAlign = 'center';
		document.getElementById('resultado2').textContent =
			'El contacto <pec> no es bienvenido en éste sistema';
		return;
	}
	if (data.termscondition != 'on') {
		console.log('no aceptó los T&C no se puede loggear');
		document.getElementById('resultado2').style.textAlign = 'center';
		document.getElementById('resultado2').style.color = 'RED';
		document.getElementById('resultado2').textContent =
			'Debe aceptar los T&C para poder usar el sistema';
		return;
	}

	/*---
        Genera objeto HTML a ser actualizado en el tag identificado como "app"
        */

	const HTMLResponse = document.querySelector('#app');
	const ul = document.createElement('ul');

	const tpl = document.createDocumentFragment();

	const systemURL = {
		listarTicket: 'http://127.0.0.1:5500/HTML/listarTicket.html',
		loginCliente: 'http://127.0.0.1:5500/HTML/loginClient.html',
	};

	const RESTAPI = {
		loginCliente: 'http://localhost:8080/api/loginCliente',
		listarTicket: 'http://localhost:8080/api/listarTicket',
	};

/*-----
    Define el URI para realizar el acceso en base al acceso a un servidor local
*/
    const MODE='LOCAL'; /*-- Instrucción a cambiar opciones LOCAL, TYPICODE o AWS --*/

	if (MODE == 'LOCAL') {
	/*-----
        Crea estructuras para acceder a data del cliente
        */

		// Nota: enviamos 'contacto' (correo) y 'password' — el servidor busca por 'contacto' para autenticar.
		// Crea el objeto login y recibe los datos del HTML
	    const login = {
	        contacto: data.contacto,
		    password: data.password
		}    

		const options = {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(login),
	};



	 	console.log('API REST:' + RESTAPI.loginCliente);
		//Punto del práctico, no exponer la password en los textos claros.
		// No usamos esto ya que expone la password
		// console.log(login);
		// Usamos esto en su lugar para mostrar todo menos la password.
	    console.log({ contacto: login.contacto, password: '[Censurado]' });

		// No usamos esto ya que expone la password
		// console.log('login(' + JSON.stringify(login) + ')');
		// Usamos esto en su lugar para mostrar todo menos la password.
	    console.log('login(contacto: ' + login.contacto + ', password: [Censurado])');

		// No usamos esto ya que expone la password
		// console.log('options ' + JSON.stringify(options));
		// Usamos esto en su lugar para mostrar todo menos la password.
	    console.log('options (body con password censurado)');
    	var API = RESTAPI.loginCliente;
	    var APIoptions = options;

	};


	/*----------------------------------------------------------------------*/
	/*---- Typicode utilizar id 803a62c8-78c8-4b63-9106-73af216d504b -------*/
	/*                                                                      */
	/* El siguiente código es utilizado para resolver la validación de      */
	/* cliente utilizando un "fake" API REST server en Typicode             */
	/* para realizar la validación con el REST API server correcto          */
	/* deberá cambiar la instrucción para que                               */
	/*              const tipycode=false;                                   */
	/*----------------------------------------------------------------------*/


	if (MODE == 'TYPICODE') {
		console.log('Acceso usando Typicode como application server');
		API =
			'https://my-json-server.typicode.com/lu7did/MesaAyuda/posts/' + data.id;
		APIoptions = { method: 'GET' };
	}

	/*----------------------------------------------------------------------*/
	/*---- AWS Accede con URL de Lambda loginUserGET                 -------*/
	/*                                                                      */
	/* cliente: 803a62c8-78c8-4b63-9106-73af216d504b                        */
	/*                                                                      */
	/* Para activar el acceso mediante AWS hacer const aws=true;            */
	/*----------------------------------------------------------------------*/


	// En modo AWS se accede con GET y se envía la password en la URL
	// if (MODE == 'AWS') {
    // console.log('Acceso usando AWS lambda como application server');
    // API='https://fmtj0jrpp9.execute-api.us-east-1.amazonaws.com/default/loginUserGET?ID=' + data.id + '&PASSWORD=' + data.password;
    // APIoptions = { method: 'GET' };
	// }


	// Se deja activo el modo AWS pero censurando la password en los logs
	if (MODE == 'AWS') {
		console.log('Acceso usando AWS lambda como application server');
		console.log('AWS URL: [URL con password censurado]');
		API='https://fmtj0jrpp9.execute-api.us-east-1.amazonaws.com/default/loginUserGET?ID=' + data.id + '&PASSWORD=' + data.password;
    	APIoptions = { method: 'GET' };
	}
	/*-----
    Realiza el acceso al API Rest utilizando gestión de sincronización mediante promesas
	utiliza URL y options definidos en los pasos anteriores
    */

	fetch(`${API}`, APIoptions)
		.then((res) => {
			return res.json();
		})
		.then((users) => {
			console.log(
				'Datos en respuesta del application server=' + JSON.stringify(users)
			);
			if (users.response == 'OK') {
				console.log('La password es correcta');
				console.log(
					'nombre(' +
						users.nombre +
						') fecha_ultimo_ingreso(' +
						users.fecha_ultimo_ingreso +
						')' +
						'mode(' + MODE + ')'
					);
					
					// Mostramos mensaje de éxito al usuario
					document.getElementById('resultado1').style.color = 'GREEN';
					document.getElementById('resultado1').style.textAlign = 'center';
					document.getElementById('resultado1').textContent =
						'¡Sesion iniciada correctamente! Cargando tickets...';

					// Esperamos 2 segundos para que el usuario vea el mensaje y luego redirigimos
					setTimeout(() => {
						console.log('Redirigiendo a login: ' + systemURL.loginCliente);
						window.location.href = systemURL.loginCliente;
					}, 2000);

				console.log(
					'id=' +
						users.id +
						' nombre=' +
						users.nombre +
						' ultimo=' +
						users.fecha_ultimo_ingreso
				);
				console.log(
					'changing to ' +
						systemURL.listarTicket +
						'?id=' +
						users.id +
						'&contacto=' +
						users.contacto +
						'&nombre=' +
						users.nombre +
						'&fecha_ultimo_ingreso=' +
						users.fecha_ultimo_ingreso +
						'&mode=' + MODE
				);
				window.location.href =
					systemURL.listarTicket +
					'?id=' +
					users.id +
					'&contacto=' +
					users.contacto +
					'&nombre=' +
					users.nombre +
					'&fecha_ultimo_ingreso=' +
					users.fecha_ultimo_ingreso +
					'&mode=' + MODE;
			} else {
				console.log('La password no es correcta');
				document.getElementById('resultado1').style.color = 'RED'; /*--Fix hecho por  Germán Lombardi IS1-2025 */
				document.getElementById('resultado1').textContent =
					'Error de login, intente nuevamente';                  /*--Fix hecho por  Germán Lombardi IS1-2025 */
			}
		});
});

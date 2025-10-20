/*---
registerClient.js
Script para manejar el registro de nuevos clientes
Basado en loginClient.js pero adaptado para crear nuevas cuentas

UADER - Ingeniería de Software I - TPFI
*/

const formE1 = document.querySelector('.form');

/*---
Intercepta el submit del formulario de registro
*/
formE1.addEventListener('submit', (event) => {
	event.preventDefault();
	const formData = new FormData(formE1);

	const data = Object.fromEntries(formData);
	console.log('Application Server: Revisa el valor del form de registro:');
	// No exponemos la password en los logs - Solo para debugging mostramos que se capturó
	console.log({ contacto: data.contacto, nombre: data.nombre, password: '[Censurado]', confirmPassword: '[Censurado]' });

	/*---
	Realiza validaciones en los datos del formulario antes de procesar
	*/

	// Validación 1: Verificar que se ingrese el email (contacto)
	if (data.contacto == '' || data.contacto) {
		console.log('Error: Debe indicar un correo electrónico');
		document.getElementById('resultado1').style.color = 'RED';
		document.getElementById('resultado1').style.textAlign = 'center';
		document.getElementById('resultado1').textContent =
			'Debe ingresar un correo electrónico válido';
		return;
	}

	// Validación 2: Verificar que se ingrese el nombre
	if (data.nombre == '' || !data.nombre) {
		console.log('Error: Debe indicar un nombre');
		document.getElementById('resultado1').style.color = 'RED';
		document.getElementById('resultado1').style.textAlign = 'center';
		document.getElementById('resultado1').textContent =
			'Debe ingresar su nombre completo';
		return;
	}

	// Validación 3: Verificar que se ingrese la password
	if (data.password == '' || !data.password) {
		console.log('Error: Debe indicar una contraseña');
		document.getElementById('resultado1').style.color = 'RED';
		document.getElementById('resultado1').style.textAlign = 'center';
		document.getElementById('resultado1').textContent =
			'Debe ingresar una contraseña';
		return;
	}

	// Validación 4: Verificar que las contraseñas coincidan
	if (data.password !== data.confirmPassword) {
		console.log('Error: Las contraseñas no coinciden');
		document.getElementById('resultado1').style.color = 'RED';
		document.getElementById('resultado1').style.textAlign = 'center';
		document.getElementById('resultado1').textContent =
			'Las contraseñas no coinciden. Por favor, verifique.';
		return;
	}

	// Validación 5: Verificar que se acepten los términos y condiciones
	if (data.termscondition != 'on') {
		console.log('Error: No aceptó los T&C');
		document.getElementById('resultado2').style.textAlign = 'center';
		document.getElementById('resultado2').style.color = 'RED';
		document.getElementById('resultado2').textContent =
			'Debe aceptar los términos y condiciones para registrarse';
		return;
	}

	/*---
	Si todas las validaciones pasaron, preparamos los datos para enviar al servidor
	*/

	const systemURL = {
		loginCliente: 'http://127.0.0.1:5500/HTML/loginClient.html',
	};

	const RESTAPI = {
		addCliente: 'http://localhost:8080/api/addCliente',
	};

	/*-----
	Define el modo de acceso - LOCAL para usar el servidor Node.js local
	*/
	const MODE = 'LOCAL';

	if (MODE == 'LOCAL') {
		/*-----
		Crea el objeto con los datos del nuevo cliente para enviar al servidor
		IMPORTANTE: El servidor espera { contacto, password, nombre }
		*/
		const nuevoCliente = {
			contacto: data.contacto,  // Email del usuario
			password: data.password,   // Contraseña elegida
			nombre: data.nombre        // Nombre completo
		};

		const options = {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(nuevoCliente),
		};

		console.log('API REST addCliente: ' + RESTAPI.addCliente);
		// Log censurado para debugging
		console.log('Datos a enviar: { contacto: ' + nuevoCliente.contacto + ', nombre: ' + nuevoCliente.nombre + ', password: [Censurado] }');

		var API = RESTAPI.addCliente;
		var APIoptions = options;

		/*-----
		Realiza la petición al servidor para crear el nuevo cliente
		*/
		fetch(`${API}`, APIoptions)
			.then((res) => {
				return res.json();
			})
			.then((respuesta) => {
				console.log(
					'Datos en respuesta del servidor=' + JSON.stringify(respuesta)
				);

				// Verificamos si el registro fue exitoso
				if (respuesta.response == 'OK') {
					console.log('¡Registro exitoso! Usuario creado correctamente');
					
					// Mostramos mensaje de éxito al usuario
					document.getElementById('resultado1').style.color = 'GREEN';
					document.getElementById('resultado1').style.textAlign = 'center';
					document.getElementById('resultado1').textContent =
						'¡Registro exitoso! Redirigiendo al login...';

					// Esperamos 2 segundos para que el usuario vea el mensaje y luego redirigimos
					setTimeout(() => {
						console.log('Redirigiendo a login: ' + systemURL.loginCliente);
						window.location.href = systemURL.loginCliente;
					}, 2000);

				} else {
					// Si hubo un error (ej: email ya existe)
					console.log('Error en el registro:', respuesta.message);
					document.getElementById('resultado1').style.color = 'RED';
					document.getElementById('resultado1').style.textAlign = 'center';
					
					// Mostramos el mensaje específico del servidor o uno genérico
					const mensajeError = respuesta.message || 'Error al registrar usuario. Intente nuevamente.';
					document.getElementById('resultado1').textContent = mensajeError;
				}
			})
			.catch((error) => {
				// Manejo de errores de red o del servidor
				console.error('Error en la petición:', error);
				document.getElementById('resultado1').style.color = 'RED';
				document.getElementById('resultado1').style.textAlign = 'center';
				document.getElementById('resultado1').textContent =
					'Error de conexión con el servidor. Verifique que el servidor esté corriendo.';
			});
	}
});

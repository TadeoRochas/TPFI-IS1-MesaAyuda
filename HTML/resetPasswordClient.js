/*---
resetPasswordClient.js
Script para manejar el reset de contraseña de clientes
Basado en registerClient.js pero adaptado para cambiar contraseñas

UADER - Ingeniería de Software I - TPFI
*/

const formE1 = document.querySelector('.form');

/*---
Intercepta el submit del formulario de reset de password
*/
formE1.addEventListener('submit', (event) => {
	event.preventDefault();
	const formData = new FormData(formE1);

	const data = Object.fromEntries(formData);
	console.log('Application Server: Revisa el valor del form de reset password:');
	// No exponemos la password en los logs - Solo para debugging mostramos que se capturó
	console.log({ contacto: data.contacto, password: '[Censurado]', confirmPassword: '[Censurado]' });

	/*---
	Realiza validaciones en los datos del formulario antes de procesar
	*/

	// Validación 1: Verificar que se ingrese el email (contacto)
	if (data.contacto == '' || !data.contacto) {
		console.log('Error: Debe indicar un correo electrónico');
		document.getElementById('resultado1').style.color = 'RED';
		document.getElementById('resultado1').style.textAlign = 'center';
		document.getElementById('resultado1').textContent =
			'Debe ingresar un correo electrónico válido';
		return;
	}

	// Validación 2: Verificar que se ingrese la nueva password
	if (data.password == '' || !data.password) {
		console.log('Error: Debe indicar una contraseña');
		document.getElementById('resultado1').style.color = 'RED';
		document.getElementById('resultado1').style.textAlign = 'center';
		document.getElementById('resultado1').textContent =
			'Debe ingresar una nueva contraseña';
		return;
	}

	// Validación 3: Verificar que las contraseñas coincidan
	if (data.password !== data.confirmPassword) {
		console.log('Error: Las contraseñas no coinciden');
		document.getElementById('resultado1').style.color = 'RED';
		document.getElementById('resultado1').style.textAlign = 'center';
		document.getElementById('resultado1').textContent =
			'Las contraseñas no coinciden. Por favor, verifique.';
		return;
	}

	// Validación 4: Verificar que se acepten los términos y condiciones
	if (data.termscondition != 'on') {
		console.log('Error: No aceptó los T&C');
		document.getElementById('resultado2').style.textAlign = 'center';
		document.getElementById('resultado2').style.color = 'RED';
		document.getElementById('resultado2').textContent =
			'Debe aceptar los términos y condiciones para cambiar la contraseña';
		return;
	}

	/*---
	Si todas las validaciones pasaron, preparamos los datos para enviar al servidor
	*/

	const systemURL = {
		loginCliente: 'http://127.0.0.1:5500/HTML/loginClient.html',
	};

	const RESTAPI = {
		resetCliente: 'http://localhost:8080/api/resetCliente',
	};

	/*-----
	Define el modo de acceso - LOCAL para usar el servidor Node.js local
	*/
	const MODE = 'LOCAL';

	if (MODE == 'LOCAL') {
		/*-----
		Crea el objeto con los datos para resetear la contraseña
		IMPORTANTE: El servidor espera { contacto, password }
		*/
		const datosReset = {
			contacto: data.contacto,  // El email del usuario
			password: data.password   // La nueva contraseña
		};

		const options = {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify(datosReset),
		};

		console.log('API REST resetCliente: ' + RESTAPI.resetCliente);
		// Log censurado para debugging
		console.log('Datos a enviar: { contacto: ' + datosReset.contacto + ', password: [Censurado] }');

		var API = RESTAPI.resetCliente;
		var APIoptions = options;

		/*-----
		Realiza la petición al servidor para cambiar la contraseña
		*/
		fetch(`${API}`, APIoptions)
			.then((res) => {
				return res.json();
			})
			.then((respuesta) => {
				console.log(
					'Datos en respuesta del servidor=' + JSON.stringify(respuesta)
				);

				// Verificamos si el cambio de contraseña fue exitoso
				if (respuesta.response == 'OK') {
					console.log('¡Contraseña cambiada exitosamente!');
					
					// Mostramos mensaje de éxito al usuario
					document.getElementById('resultado1').style.color = 'GREEN';
					document.getElementById('resultado1').style.textAlign = 'center';
					document.getElementById('resultado1').textContent =
						'¡Contraseña actualizada exitosamente! Redirigiendo al login...';

					// Esperamos 2 segundos para que el usuario vea el mensaje y luego redirigimos
					setTimeout(() => {
						console.log('Redirigiendo a login: ' + systemURL.loginCliente);
						window.location.href = systemURL.loginCliente;
					}, 2000);

				} else {
					// Si hubo un error (ej: usuario no existe)
					console.log('Error al cambiar contraseña:', respuesta.message);
					document.getElementById('resultado1').style.color = 'RED';
					document.getElementById('resultado1').style.textAlign = 'center';
					
					// Mostramos el mensaje específico del servidor o uno genérico
					const mensajeError = respuesta.message || 'Error al cambiar la contraseña. Intente nuevamente.';
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


/*-----------------------------------------------------------------------------------------------------------------
  MesaAyuda.js debe copiarse al directorio del proyecto express como index.js

  REST API 
  UADER - IS1
  Caso de estudio MesaAyuda

  Dr. Pedro E. Colla 2023,2025
 *----------------------------------------------------------------------------------------------------------------*/
//AWS_SDK_JS_SUPPRESS_MAINTENANCE_MODE_MESSAGE=1

import express from 'express';
import crypto from 'crypto';
console.log("Comenzando servidor");

// const crypto = require('crypto');
console.log("crypto Ok!");

//const express = require('express');
//console.log("express Ok!");

const app = express();
console.log("express ready!");

const PORT = 8080;

import cors from 'cors';

//const cors = require('cors');
console.log("cors ok!");

app.use(cors());
console.log("cors ready!");

import AWS from 'aws-sdk'
//var AWS = require('aws-sdk');
console.log("aws-sdk ready!");

/*----
Acquire critical security resources from an external file out of the path
*/
//const accessKeyId = require('../accessKeyId.js');
//const secretAccessKey = require('../secretAccessKey.js');
import accessKeyId from '../accessKeyId.js';
import secretAccessKey  from '../secretAccessKey.js';

let awsConfig = {
    "region"         : "us-east-1",
    "endpoint"       : "http://dynamodb.us-east-1.amazonaws.com",
    "accessKeyId"    : accessKeyId, 
    "secretAccessKey": secretAccessKey
};

AWS.config.update(awsConfig);
console.log("Servidor listo!");
let docClient = new AWS.DynamoDB.DocumentClient();

app.listen(
    PORT,
    () => console.log(`Servidor listo en http://localhost:${PORT}`)
);

app.use(express.json());

app.get('/api/cliente', (req,res) => {
    res.status(200).send({response : "OK", message : "API Ready"});
    console.log("API cliente: OK");
});

/*-----------
función para hacer el parse de un archivo JSON
*/
function jsonParser(keyValue,stringValue) {
    var string = JSON.stringify(stringValue);
    var objectValue = JSON.parse(string);
    return objectValue[keyValue];
}
/*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*
/*                                                       API REST Cliente                                                            *
/*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*


/*-----------
  /api/getCliente
  Esta API permite acceder a un cliente dado su id
*/
app.post('/api/getCliente/:id', (req,res) => {
    const { id } = req.params;
    console.log("getCliente: id("+id+")");
    var params = {
        TableName: "cliente",
        Key: {
            "id" : id
            //test use "id": "0533a95d-7eef-4c6b-b753-1a41c9d1fbd0"   
             }
        };
    docClient.get(params, function (err, data) {
        if (err)  {
            res.status(400).send(JSON.stringify({response : "ERROR", message : "DB access error "+ null}));
        } else {

            if (Object.keys(data).length != 0) {
               // Excluir password de la respuesta por seguridad
               // Creamos un nuevo objeto con solo los datos que queremos enviar (sin password)
               const clienteSinPassword = {
                   id: data.Item.id,
                   nombre: data.Item.nombre,
                   contacto: data.Item.contacto,
                   activo: data.Item.activo,
                   registrado: data.Item.registrado,
                   primer_ingreso: data.Item.primer_ingreso,
                   fecha_alta: data.Item.fecha_alta,
                   fecha_cambio_password: data.Item.fecha_cambio_password,
                   fecha_ultimo_ingreso: data.Item.fecha_ultimo_ingreso
               };
               res.status(200).send(JSON.stringify({"response":"OK","cliente" : clienteSinPassword}),null,2);
            } else {
               res.status(400).send(JSON.stringify({"response":"ERROR",message : "Cliente no existe"}),null,2);
            }
        }    
    })


} );

/*---
  /api/loginCliente
  Esta API permite acceder a un cliente por contacto y comparar la password pasada en un JSON en el cuerpo con la indicada en el DB
*/  
app.post('/api/loginCliente', (req, res) => {
    // Cambio solicitado: usar contacto (correo) en lugar de id para el login
    // Nota: el cliente envía { contacto, password } en el body; el servidor busca por 'contacto'.

    const { contacto, password } = req.body;

    // Por seguridad no mostramos la contraseña en texto claro en los logs

    // console.log(`loginCliente: contacto(${contacto}) password=${password}`);
    console.log(`loginCliente: contacto(${contacto}) password=[Censurado]`);

    if (!password) {
        res.status(400).send({ response: 'ERROR', message: 'Password no informada' });
        return;
    }

    if (!contacto) {
        res.status(400).send({ response: 'ERROR', message: 'contacto no informado' });
        return;
    }

    const paramsScan = {
        TableName: 'cliente',
        FilterExpression: 'contacto = :contacto',
        ExpressionAttributeValues: {
            ':contacto': contacto,
        },
    };

    console.log('loginCliente: paramsScan=', paramsScan);

    docClient.scan(paramsScan, function (err, data) {
        if (err) {
            console.error('loginCliente: error en scan ->', err);
            res.status(400).send(JSON.stringify({ response: 'ERROR', message: 'DB access error ' + err }));
            return;
        }

        // Log de debugging para ver qué devuelve la búsqueda
        console.log('loginCliente: data recibido =', JSON.stringify(data));
        console.log('loginCliente: cantidad de items encontrados =', data?.Items?.length || 0);

        if (!data || !data.Items || data.Items.length === 0) {
            console.log('loginCliente: NO se encontró el usuario con contacto:', contacto);
            res.status(400).send({ response: 'ERROR', message: 'Cliente invalido' });
            return;
        }

        console.log('loginCliente: Usuario encontrado! Item[0] =', JSON.stringify(data.Items[0]));

        const item = data.Items[0];
        const paswd = jsonParser('password', item);
        const activo = jsonParser('activo', item);
        const idResp = jsonParser('id', item);
        const contactoResp = jsonParser('contacto', item);

        //El servidor valida la password comparandola con el DB
        if (password == paswd) {
            if (activo == true) {
                const nombre = jsonParser('nombre', item);
                const fecha_ultimo_ingreso = jsonParser('fecha_ultimo_ingreso', item);
                res.status(200).send(
                    JSON.stringify({ response: 'OK', id: idResp, nombre: nombre, contacto: contactoResp, fecha_ultimo_ingreso: fecha_ultimo_ingreso }) // Excluir password de la respuesta por seguridad
                );
            } else {
                res.status(400).send(JSON.stringify({ response: 'ERROR', message: 'Cliente no activo' }));
            }
        } else {
            res.status(400).send(JSON.stringify({ response: 'ERROR', message: 'usuario incorrecto' }));
        }
    });
});

/*---------
Función para realizar el SCAN de un DB de cliente usando contacto como clave para la búsqueda (no es clave formal del DB)
*/
async function scanDb(contacto) {
    var docClient = new AWS.DynamoDB.DocumentClient();
    const scanKey=contacto;
    const paramsScan = { // ScanInput
      TableName: "cliente", // required
      Select: "ALL_ATTRIBUTES" || "ALL_PROJECTED_ATTRIBUTES" || "SPECIFIC_ATTRIBUTES" || "COUNT",
      FilterExpression : 'contacto = :contacto',
      ExpressionAttributeValues : {':contacto' : scanKey}
    };      
    var objectPromise = await docClient.scan(paramsScan).promise().then((data) => {
          return data.Items 
    });  
    return objectPromise;
}

/*----
addCliente
Revisa si el contacto (e-mail) existe y en caso que no da de alta el cliente generando un id al azar
*/

//Crea un usuario nuevo
app.post('/api/addCliente', (req,res) => {

    const {contacto} = req.body;
    const {password} = req.body;
    const {nombre}   = req.body;

    //Mantiene la password censurada en los logs

    //console.log("addCliente: contacto("+contacto+") nombre("+nombre+") password("+password+")");
    console.log("addCliente: contacto("+contacto+") nombre("+nombre+") password=[Censurado]");
    
    if (!password) {
        res.status(400).send({response : "ERROR" , message: "Password no informada"});
        return;
    }
    if (!nombre) {
        res.status(400).send({response : "ERROR", message : "Nombre no informado"});
        return;
    }

    if (!contacto){
        res.status(400).send({response : "ERROR" , message : "Contacto no informado"});
        return;
    } 

    scanDb(contacto)
    .then(resultDb => {
      if (Object.keys(resultDb).length != 0) {
        res.status(400).send({response : "ERROR" , message : "Cliente ya existe"});
        return;
      } else {
        var hoy = new Date();
        var dd = String(hoy.getDate()).padStart(2, '0');
        var mm = String(hoy.getMonth() + 1).padStart(2, '0'); //January is 0!
        var yyyy = hoy.getFullYear();
        hoy = dd + '/' + mm + '/' + yyyy;
    
        const newCliente = {
         id                    : crypto.randomUUID(), // Genera un ID único (ej: "a1b2c3d4-e5f6-7890-1234-567890abcdef")
         nombre                : nombre,
         contacto              : contacto, // El correo se guarda como contacto para búsquedas
         password              : password,
         activo                : true,
         registrado            : true,
         primer_ingreso        : false,
         fecha_alta            : hoy,
         fecha_cambio_password : hoy,
         fecha_ultimo_ingreso  : hoy,
        };
    
        const paramsPut = {
          TableName: "cliente",
          Item: newCliente,
          ConditionExpression:'attribute_not_exists(id)',
        };

        docClient.put(paramsPut, function (err, data) {
            if (err) {
                res.status(400).send(JSON.stringify({response : "ERROR", message : "DB error" + err}));
            } else {
                // Excluir password de la respuesta por seguridad
                // Creamos un nuevo objeto con solo los datos que queremos enviar (sin password)
                const clienteSinPassword = {
                    id: newCliente.id,
                    nombre: newCliente.nombre,
                    contacto: newCliente.contacto,
                    activo: newCliente.activo,
                    registrado: newCliente.registrado,
                    primer_ingreso: newCliente.primer_ingreso,
                    fecha_alta: newCliente.fecha_alta,
                    fecha_cambio_password: newCliente.fecha_cambio_password,
                    fecha_ultimo_ingreso: newCliente.fecha_ultimo_ingreso
                };
                res.status(200).send(JSON.stringify({response : "OK", "cliente": clienteSinPassword}));
            }
        });
    }
    });

});
/*----------
/api/updateCliente
Permite actualizar datos del cliente contacto, nombre, estado de activo y registrado
*/
app.post('/api/updateCliente', (req,res) => {
    
    const {id} = req.body;
    const {nombre}   = req.body; 
    const {password} = req.body;

    var activo = ((req.body.activo+'').toLowerCase() === 'true')
    var registrado = ((req.body.registrado+'').toLowerCase() === 'true')


    // Mantiene la password censurada en los logs
    // console.log("updateCliente: id("+id+") nombre("+nombre+") password("+password+") activo("+activo+") registrado("+registrado+")");
    console.log("updateCliente: id("+id+") nombre("+nombre+") password=[Censurado] activo("+activo+") registrado("+registrado+")");

    if (!id) {
        res.status(400).send({response : "ERROR" , message: "Id no informada"});
        return;
    }

    if (!nombre) {
        res.status(400).send({response : "ERROR" , message: "Nombre no informado"});
        return;
    }

    if (!password) {
        res.status(400).send({response : "ERROR" , message: "Password no informado"});
        return;
    }

    var params = {
        TableName: "cliente",
        Key: {
            "id" : id
            //test use "id": "0533a95d-7eef-4c6b-b753-1a41c9d1fbd0"   
             }
        };
        
    docClient.get(params, function (err, data) {
        if (err)  {
            res.status(400).send(JSON.stringify({response : "ERROR", message : "DB access error "+ null}));
            return;
        } else {

            if (Object.keys(data).length == 0) {
                res.status(400).send(JSON.stringify({"response":"ERROR",message : "Cliente no existe"}),null,2);
                return;
            } else {

                const paramsUpdate = { 
   
                    ExpressionAttributeNames: { 
                         "#a": "activo", 
                         "#n": "nombre",
                         "#p": "password",
                         "#r": "registrado"

                    }, 
                    ExpressionAttributeValues: { 
                        ":a": activo , 
                        ":p": password,
                        ":n": nombre , 
                        ":r": registrado 
                   }, 
                   Key: { 
                       "id": id 
                   }, 
                   ReturnValues: "ALL_NEW", 
                   TableName: "cliente", 
                   UpdateExpression: "SET #n = :n, #p = :p, #a = :a, #r = :r" 
                };
                docClient.update(paramsUpdate, function (err, data) {
                    if (err)  {
                        res.status(400).send(JSON.stringify({response : "ERROR", message : "DB access error "+err}));
                        return;
                    } else {
                        // Excluir password de la respuesta por seguridad
                        // DynamoDB devuelve los datos actualizados en data.Attributes
                        // Creamos un nuevo objeto con solo los datos que queremos enviar (sin password)
                        const dataSinPassword = {
                            id: data.Attributes.id,
                            nombre: data.Attributes.nombre,
                            contacto: data.Attributes.contacto,
                            activo: data.Attributes.activo,
                            registrado: data.Attributes.registrado,
                            primer_ingreso: data.Attributes.primer_ingreso,
                            fecha_alta: data.Attributes.fecha_alta,
                            fecha_cambio_password: data.Attributes.fecha_cambio_password,
                            fecha_ultimo_ingreso: data.Attributes.fecha_ultimo_ingreso
                        };
                        res.status(200).send(JSON.stringify({response : "OK", message : "updated" , "data": { Attributes: dataSinPassword }}));
                    }    
                });    
            }
        }    
    })


});
/*-------
/api/resetCliente
Permite cambiar la password de un cliente buscando por contacto (email)
*/
app.post('/api/resetCliente', (req,res) => {
    
    const {contacto} = req.body;
    const {password} = req.body;
 
    console.log("resetCliente: contacto(" + contacto + ") password=[Censurado]");

    if (!contacto) {
        res.status(400).send({response : "ERROR" , message: "Contacto (email) no informado"});
        return;
    }

    if (!password) {
        res.status(400).send({response : "ERROR" , message: "Password no informada"});
        return;
    }

    // Primero buscamos el cliente por contacto (email) usando scanDb
    scanDb(contacto)
    .then(resultDb => {
        // scanDb() devuelve directamente el array de Items, no el objeto data completo
        if (!resultDb || resultDb.length === 0) {
            res.status(400).send({response : "ERROR" , message : "Cliente no existe"});
            return;
        } else {
            // Cliente encontrado, obtenemos su ID (UUID)
            console.log('resetCliente: Usuario encontrado! Item[0] =', JSON.stringify(resultDb[0]));
            
            const item = resultDb[0];
            const clienteId = jsonParser('id', item);
            
            console.log('resetCliente: ID del cliente a actualizar:', clienteId);

            // Ahora actualizamos la password usando el ID
            const paramsUpdate = { 
                ExpressionAttributeNames: { 
                     "#p": "password" 
                }, 
                ExpressionAttributeValues: { 
                    ":p": password 
               }, 
               Key: { 
                   "id": clienteId 
               }, 
               ReturnValues: "ALL_NEW", 
               TableName: "cliente", 
               UpdateExpression: "SET #p = :p" 
            };
            
            docClient.update(paramsUpdate, function (err, data) {
                if (err)  {
                    res.status(400).send(JSON.stringify({response : "ERROR", message : "DB access error "+err}));
                    return;
                } else {
                    // Excluir password de la respuesta por seguridad
                    const dataSinPassword = {
                        id: data.Attributes.id,
                        nombre: data.Attributes.nombre,
                        contacto: data.Attributes.contacto,
                        activo: data.Attributes.activo,
                        registrado: data.Attributes.registrado,
                        primer_ingreso: data.Attributes.primer_ingreso,
                        fecha_alta: data.Attributes.fecha_alta,
                        fecha_cambio_password: data.Attributes.fecha_cambio_password,
                        fecha_ultimo_ingreso: data.Attributes.fecha_ultimo_ingreso
                    };
                    console.log('resetCliente: Contraseña actualizada exitosamente');
                    res.status(200).send(JSON.stringify({response : "OK", message : "updated" , "data": { Attributes: dataSinPassword }}));
                }    
            });
        }
    })
    .catch(error => {
        console.error('resetCliente: Error en scanDb:', error);
        res.status(400).send({response : "ERROR" , message : "Error al buscar cliente"});
    });
});
/*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*
/*                                                       API REST ticket                                                             *
/*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*=*/

/*---------
Función para realizar el SCAN de un DB de cliente usando contacto como clave para la búsqueda (no es clave formal del DB)
*/
async function scanDbTicket(clienteID) {
    var docClient = new AWS.DynamoDB.DocumentClient();
    const scanKey=clienteID;
    const paramsScan = { // ScanInput
      TableName: "ticket", // required
      Select: "ALL_ATTRIBUTES" || "ALL_PROJECTED_ATTRIBUTES" || "SPECIFIC_ATTRIBUTES" || "COUNT",
      FilterExpression : 'clienteID = :clienteID',
      ExpressionAttributeValues : {':clienteID' : scanKey}
    };      
    var objectPromise = await docClient.scan(paramsScan).promise().then((data) => {
          return data.Items 
    });  
    return objectPromise;
}
/*----------
  listarTicket
  API REST para obtener todos los tickets de un clienteID
*/  
app.post('/api/listarTicket', (req,res) => {

    const {clienteID}  = req.body;
    console.log("listarTicket: clienteID("+clienteID+")");
 
    if (!clienteID) {
        res.status(400).send({response : "ERROR" , message: "clienteID no informada"});
        return;
    }

    scanDbTicket(clienteID)
    .then(resultDb => {
      if (Object.keys(resultDb).length == 0) {
        res.status(400).send({response : "ERROR" , message : "clienteID no tiene tickets"});
        return;
      } else {
        res.status(200).send(JSON.stringify({response : "OK",  "data": resultDb}));
    }

    });

});

/*---------
  getTicket
  API REST para obtener los detalles de un ticket
*/
app.post('/api/getTicket', (req,res) => {
    const {id}  = req.body;
    console.log("getTicket: id("+id+")");
 
    if (!id) {
        res.status(400).send({response : "ERROR" , message: "ticket id no informada"});
        return;
    }
    var params = {
        TableName: "ticket",
        Key: {
            "id" : id
            //"clienteID": "0533a95d-7eef-4c6b-b753-1a41c9d1fbd0"   
            //"id"       : "e08905a8-4aab-45bf-9948-4ba2b8602ced"
        }
    };
    docClient.get(params, function (err, data) {
        if (err) {
            res.status(400).send(JSON.stringify({response : "ERROR", message : "DB access error "+err}));
        }
        else {
            if (Object.keys(data).length == 0) {
                res.status(400).send({response : "ERROR" , message : "ticket invalido"});
            } else {
                res.status(200).send(JSON.stringify({response : "OK", "data" : data}));    
            }    
        }
    })
});

/*-----------------
/api/addTicket
API REST para agregar ticket (genera id)
*/
app.post('/api/addTicket', (req,res) => {

    const {clienteID} = req.body;
    const estado_solucion = 1;
    const {solucion} = req.body;
    const {descripcion} = req.body;

    var hoy = new Date();
    var dd = String(hoy.getDate()).padStart(2, '0');
    var mm = String(hoy.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = hoy.getFullYear();
    hoy = dd + '/' + mm + '/' + yyyy;

    const newTicket = {
     id                    : crypto.randomUUID(),
     clienteID             : clienteID,
     estado_solucion       : estado_solucion,
     solucion              : solucion,
     descripcion           : descripcion,
     fecha_apertura        : hoy,
     ultimo_contacto       : hoy
    };

    const paramsPut = {
      TableName: "ticket",
      Item: newTicket,
      ConditionExpression:'attribute_not_exists(id)',
    };

    docClient.put(paramsPut, function (err, data) {
        if (err) {
            res.status(400).send(JSON.stringify({response : "ERROR", message : "DB error" + err}));
        } else {
            res.status(200).send(JSON.stringify({response : "OK", "ticket": newTicket}));
        }
    });
}
)

/*--------
/api/updateTicket
Dado un id actualiza el ticket, debe informarse la totalidad del ticket excepto ultimo_contacto
*/
app.post('/api/updateTicket', (req,res) => {

    const {id} = req.body;
    const {clienteID} = req.body;
    const {estado_solucion} = req.body;
    const {solucion} = req.body;
    const {descripcion} = req.body;
    const {fecha_apertura} = req.body;

    if (!id) {
        res.status(400).send({response : "ERROR" , message: "Id no informada"});
        return;
    }

    if (!clienteID) {
        res.status(400).send({response : "ERROR" , message: "clienteID no informada"});
        return;
    }

    if (!estado_solucion) {
        res.status(400).send({response : "ERROR" , message: "estado_solucion no informada"});
        return;
    }

    if (!solucion) {
        res.status(400).send({response : "ERROR" , message: "solucion no informado"});
        return;
    }

    if (!fecha_apertura) {
        res.status(400).send({response : "ERROR" , message: "fecha apertura"});
        return;
    }
    
    var hoy = new Date();
    var dd = String(hoy.getDate()).padStart(2, '0');
    var mm = String(hoy.getMonth() + 1).padStart(2, '0'); //January is 0!
    var yyyy = hoy.getFullYear();
    hoy = dd + '/' + mm + '/' + yyyy;

    const ultimo_contacto = hoy;

    var params = {
        TableName: "ticket",
        Key: {
            "id" : id
            //test use "id": "0533a95d-7eef-4c6b-b753-1a41c9d1fbd0"   
             }
        };
        
    docClient.get(params, function (err, data) {
        if (err)  {
            res.status(400).send(JSON.stringify({response : "ERROR", message : "DB access error "+ null}));
            return;
        } else {

            if (Object.keys(data).length == 0) {
                res.status(400).send(JSON.stringify({"response":"ERROR",message : "ticket no existe"}),null,2);
                return;
            } else {

                const paramsUpdate = { 
   
                    ExpressionAttributeNames: { 
                         "#c": "clienteID", 
                         "#e": "estado_solucion",
                         "#s": "solucion",
                         "#a": "fecha_apertura",
                         "#u": "ultimo_contacto",
                         "#d": "descripcion"
                    }, 
                    ExpressionAttributeValues: { 
                        ":c":  clienteID, 
                        ":e":  estado_solucion , 
                        ":s":  solucion , 
                        ":a":  fecha_apertura,
                        ":u":  ultimo_contacto,
                        ":d":  descripcion 
                   }, 
                   Key: { 
                       "id": id 
                   }, 
                   ReturnValues: "ALL_NEW", 
                   TableName: "ticket", 
                   UpdateExpression: "SET #c = :c, #e = :e, #a = :a, #s = :s, #d = :d, #u = :u" 
                };
                docClient.update(paramsUpdate, function (err, data) {
                    if (err)  {
                        res.status(400).send(JSON.stringify({response : "ERROR", message : "DB access error "+err}));
                        return;
                    } else {
                        res.status(200).send(JSON.stringify({response : "OK",  "data": data}));
                    }    
                });    
            }
        }    
    })

});
/*-------------------------------------------------[ Fin del API REST ]-------------------------------------------------------------*/
const request = require('request');
const fs = require('fs');
const path = require('path');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const mysql = require('mysql');
const myRequest = require('./myRequest');


function restart(site, title, new_price, meta_title = '', meta_price = '') {
    let genPromise = new Promise(function (resolve, reject) {


        let promise = new Promise(function (resolve, reject) {


            const connection = mysql.createConnection({
                host: "localhost",
                user: "root",
                database: 'mysql',
                password: "M8o9gbojm8o9gbojm8o9gboj"
            });

            connection.connect();
            connection.query(`INSERT INTO sites (site, title, new_price, meta_title, meta_price) VALUES ('${site}', '${title}', '${new_price}', '${meta_title}', '${meta_price}')`, function (error, results, fields) {
                if (error) throw error;

            });
            connection.query(`SELECT * FROM links WHERE site='${site}'`, function (error, results, fields) {
                if (error) throw error;
                console.log(results);

                resolve(results);
            });

            connection.end();



        }).then((results) => {
            resolve(results);
            const connection = mysql.createConnection({
                host: "localhost",
                user: "root",
                database: 'mysql',
                password: "M8o9gbojm8o9gbojm8o9gboj"
            });

            connection.connect();
            connection.query(`DELETE from links WHERE site='${site}'`, function (error, results, fields) {
                if (error) throw error;

            });
            connection.end();

        }).catch(() => console.log('Какая-то херня'))





    });



    return genPromise;
}












module.exports = restart;
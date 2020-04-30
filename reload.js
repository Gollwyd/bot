const easyvk = require('easyvk');
const path = require('path');
const express = require('express');
const app = express();
const mysql = require('mysql');
const jsdom = require('jsdom');
const request = require('request');
const { JSDOM } = jsdom;




async function getSelector(site) {





    let promise = new Promise((resolve, reject) => {
        const connection = mysql.createConnection({
            host: "localhost",
            user: "root",
            database: 'mysql',
            password: "M8o9gbojm8o9gbojm8o9gboj"
        });

        connection.connect();
        connection.query(`SELECT new_price, meta_price FROM sites WHERE site="${site}"`, function (error, results, fields) {
            if (error) { console.log('Сайта нет' + site); reject("Сайта нет"); }

            if (results.length == 0) reject(console.log("Сайта нет в списке"));
            resolve(results);
        });
        connection.end();

    });

    let results = await promise;
    return results;

}





async function reload() {
    console.log("Перезагрузка началась");
    easyvk({
        utils: {
            bots: true
        },
        token: '707170290d60f4c1418b379e6952fe095e5f4e8fd84b341ab9368371b87e888a98bfe67265fc4a71fd878'

    }).then(async vk => {

        //Выгружаем все ссылки
        let promiseAllLinks = new Promise((resolve, reject) => {

            const connection = mysql.createConnection({
                host: "localhost",
                user: "root",
                database: 'mysql',
                password: "M8o9gbojm8o9gbojm8o9gboj"
            });

            connection.connect();
            connection.query(`SELECT id, site, link, user_id, new_price, title FROM links`, function (error, results, fields) {
                if (error) throw error;
                resolve(results);

            });

            connection.end();
        });

        let allLinks = await promiseAllLinks;




        allLinks.forEach(e => {
            let price = '';

            if (e.new_price) {

                request(e.link, (err, res, body) => {
                    if (err) { console.log(err); return; }

                    getSelector(e.site).then((selectors) => {

                        const dom = new JSDOM(body);

                        try {
                            if (selectors[0].meta_price == "content") {
                                price = dom.window.document.querySelector(selectors[0].new_price).content;
                            } else if (selectors[0].meta_price == "text") {
                                let reg = new RegExp(`${selectors[0].new_price}...............`);
                                let preprice = body.match(reg);
                                price = preprice[0];


                            } else {
                                price = dom.window.document.querySelector(selectors[0].new_price).innerHTML;
                            }

                            price = price.replace(/[,.]\d./, " "); // почка или запятая, после которой цифра и любой знак удаляются (убираем копейки)
                            price = price.replace(/\s\d+/g, "");   // пробел  и цифры после него удаляются 
                            price = price.replace(/\D+/g, "");//оставляем только цифры

                        } catch (error) {
                            console.log('Старый магаз при перескане шалит' + e.site);
                            if (e.new_price != "") {

                                const connection = mysql.createConnection({
                                    host: "localhost",
                                    user: "root",
                                    database: 'mysql',
                                    password: "M8o9gbojm8o9gbojm8o9gboj"
                                });

                                connection.connect();
                                connection.query(`update links set new_price = '${price}' where id = '${e.id}'`, function (error, results, fields) {
                                    if (error) { console.log('Ошибка при изменеии цены'); }


                                });
                                connection.end();


                                vk.call("messages.send", {
                                    message: `К сожалению ${e.title} больше не продается \n ${e.link}`,
                                    user_id: e.user_id,
                                    random_id: easyvk.randomId(),

                                }, 'post');
                            }
                        }


                    }).then(() => {

                        if (e.new_price == price || !price) { } else {
                            vk.call("messages.send", {
                                message: `Отличные новости! ${e.title} теперь стоит ${price}₽ вместо ${e.new_price}₽. \n ${e.link}`,
                                user_id: e.user_id,
                                random_id: easyvk.randomId(),

                            }, 'post');


                            const connection = mysql.createConnection({
                                host: "localhost",
                                user: "root",
                                database: 'mysql',
                                password: "M8o9gbojm8o9gbojm8o9gboj"
                            });

                            connection.connect();
                            connection.query(`update links set new_price = '${price}' where id = '${e.id}'`, function (error, results, fields) {
                                if (error) { console.log('Ошибка при изменеии цены'); }


                            });
                            connection.end();


                            console.log('меняем цену');
                        }
                    })





                })


            }





        }); console.log("Конец перезагрузки")



    });








}








module.exports = reload;
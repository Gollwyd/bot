const easyvk = require('easyvk');
const path = require('path');
const express = require('express');
const app = express();
const mysql = require('mysql');
const jsdom = require('jsdom');
const request = require('request');
const { JSDOM } = jsdom;
const myRequest = require('./myRequest');

function itemButton(link, id) {
    return {
        "inline": true,
        "one_time": false,
        "buttons": [
            [{
                "action": {
                    "type": "text",
                    "label": "Удалить",
                    "payload": `{"button": "${id}"}`,
                },

            }, {
                "action": {
                    "type": "open_link",
                    // "payload": "{\"button\": \"1\"}",
                    "link": link,
                    "label": "Открыть"
                },

            }
            ]
        ]
    }
}


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



        let counter = 0;
        let intervalID = setInterval(interval, 3000);
        function interval() {
            if (counter < allLinks.length) {
                let e = allLinks[counter];
                let price = '';
                //let newlink = e.link.replace(/\//g, "%2F");
                //newlink = newlink.replace(/:/g, "%3A");
                //newlink = "https://alitems.com/g/1e8d1144945880bfd78b16525dc3e8/?ulp=" + newlink;
                let changeMenuButton = JSON.stringify(itemButton(e.link, e.id));

                if (4) {     //e.new_price    пока оставляем перепроверять поехавшие ссылки, но не сообщаем, если они гной 

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
                                        message: `К сожалению ${e.title} больше не продается`,
                                        user_id: e.user_id,
                                        random_id: easyvk.randomId(),

                                        keyboard: changeMenuButton,


                                    }, 'post');
                                }
                            }
                            price = price.replace(/^\D+/, ""); //все не цифры в начале строки удаляем
                            price = price.replace(/[,.].+/, ""); // удаляем всё после точки  запятой или пробела
                            price = price.replace(/![\d ].+/, ""); // удаляем всё после точки  запятой или пробела
                            price = price.replace(/\D/g, "");

                            if (price == '') { console.log("Цена обнулилась при перескане " + e.site); price = e.new_price; }


                        }).then(() => {

                            if (e.new_price == price || !price) { } else {
                                vk.call("messages.send", {
                                    message: `Отличные новости! ${e.title} теперь стоит ${price} ₽ вместо ${e.new_price} ₽.`,
                                    user_id: e.user_id,
                                    random_id: easyvk.randomId(),

                                    keyboard: changeMenuButton,

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


                                console.log('меняем цену' + e.site);
                            }
                        })
                    })
                }




                counter++;
            } else {
                console.log("Конец перезагрузки");
                clearInterval(intervalID);

            }

        }


        //  allLinks.forEach(e => {


        //        }); console.log("Конец перезагрузки")



    });








}








module.exports = reload;
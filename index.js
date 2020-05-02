const getPrice = require('./getPrice');
const easyvk = require('easyvk');
const path = require('path');
const express = require('express');
const app = express();
const mysql = require('mysql');
const restart = require('./restart');
const reload = require('./reload');
let mainMenu = {
    "one_time": false,
    "buttons": [
        [{
            "action": {
                "type": "text",
                "payload": "{\"button\": \"1\"}",
                "label": "Мой список отслеживания"
            },

        },
        ]
    ]
}
let letyshopsButton = {
    "inline": true,
    "one_time": false,
    "buttons": [
        [{
            "action": {
                "type": "open_link",
                // "payload": "{\"button\": \"1\"}",
                "link": "https://letyshops.com/soc/sh-1?r=547551",
                "label": "Вернуть часть денег с покупки",
            },

        }
        ]
    ]
}
let errorButtons = {
    "inline": true,
    "one_time": false,
    "buttons": [
        [{
            "action": {
                "type": "text",
                "payload": "{\"button\": \"1\"}",
                "label": "Мой список отслеживания"
            },

        },], [{
            "action": {
                "type": "open_link",
                // "payload": "{\"button\": \"1\"}",
                "link": "https://letyshops.com/soc/sh-1?r=547551",
                "label": "Вернуть часть денег с покупки"
            },

        }
        ]
    ]
}
mainMenu = JSON.stringify(mainMenu);
errorButtons = JSON.stringify(errorButtons);
letyshopsButton = JSON.stringify(letyshopsButton);







easyvk({
    utils: {
        bots: true
    },
    token: '707170290d60f4c1418b379e6952fe095e5f4e8fd84b341ab9368371b87e888a98bfe67265fc4a71fd878'

}).then(async vk => {

    vk.bots.longpoll.connect().then((connection) => {

        connection.on('message_new', (msg) => {

            //console.log(msg);
            let car;
            try {
                car = msg.client_info.carousel;
            } catch (error) {
                car = false;
            }


            msg = msg.message;
            let link;
            try {
                link = msg.attachments[0].link.url;
            } catch (error) {
                link = msg.text;
            }
            if (link.match(/:\/\/m\./)) { link = link.replace(/:\/\/m\./, ":\/\/"); }

            if (msg.payload && msg.payload == '{"command":"start"}') {
                vk.call("messages.send", {
                    message: `Привет! \n Пришли мне ссылку на страницу из интрнет-магазина с вещью, которую хочешь купить. 
                    Мы будем отслеживать стоимость и сообщим, когда продавцы снизят цену\n 
                    P.S. В магазинах одежды каждые три масяца распродажи.`,
                    user_id: msg.from_id,
                    random_id: easyvk.randomId(),
                    keyboard: mainMenu,

                }, 'post')



            } else if (msg.payload && Number(msg.payload.replace(/\D+/g, "")) > 40) {
                let promise = new Promise(function (resolve, reject) {
                    const connection = mysql.createConnection({
                        host: "localhost",
                        user: "root",
                        database: 'mysql',
                        password: "M8o9gbojm8o9gbojm8o9gboj"
                    });

                    connection.connect();
                    connection.query(`delete from links where id = '${Number(msg.payload.replace(/\D+/g, ""))}'`, function (error, results, fields) {
                        if (error) throw error;
                        resolve(results);
                    });
                    connection.end();
                }).then((results) => {
                    let param = {
                        message: `Удалено`,
                        user_id: msg.from_id,
                        random_id: easyvk.randomId(),
                        keyboard: mainMenu,
                    }
                    vk.call("messages.send", param, 'post')
                    console.log(results);
                })
            } else if (msg.payload == '{"button":"1"}') {
                desktopLinks = [];
                let promise = new Promise(function (resolve, reject) {
                    const connection = mysql.createConnection({
                        host: "localhost",
                        user: "root",
                        database: 'mysql',
                        password: "M8o9gbojm8o9gbojm8o9gboj"
                    });

                    connection.connect();
                    connection.query(`SELECT * FROM links WHERE user_id='${msg.from_id}'`, function (error, results, fields) {
                        if (error) throw error;
                        resolve(results);
                    });
                    connection.end();
                }).then((results) => {
                    let elements = [];

                    results.forEach(e => {

                        let element = {
                            "title": e.title || '«Скоро мы начнем отслеживание»',
                            "description": `Текущая стоимость ${e.new_price} ₽ в магазине ${e.site}`,
                            "action": {
                                "type": "open_link",
                                "link": e.link,
                            },
                            //"photo_id": "-109837093_457242809",
                            "buttons": [{
                                "action": {
                                    "type": "text",
                                    "label": "Удалить",
                                    "payload": `{"button": "${e.id}"}`,
                                },// "color": "positive",
                            },
                            {
                                "action": {
                                    "type": "open_link",
                                    "link": e.link,
                                    "label": "Открыть"
                                },
                            }]
                        }
                        elements.push(element);
                        desktopLinks.push("\n" + e.title + " — " + e.new_price + " ₽");
                        desktopLinks.push(e.link);

                    });
                    if (!results.length) { desktopLinks.push("Список пуст"); };

                    let mes = `Вещи из Вашего списка`
                    while (elements.length > 0 && car) {

                        setInterval(() => { }, 100);

                        vk.call("messages.send", {
                            message: mes,
                            user_id: msg.from_id,
                            random_id: easyvk.randomId(),
                            template: JSON.stringify({
                                "type": "carousel",
                                "elements": elements.splice(0, 10),
                            }),

                        }, 'post')

                        mes = 'Вот еще ...';


                    }


                }).then(() => {
                    if (!car) {
                        vk.call("messages.send", {
                            message: "Редактирование доступтно только со смартфона \n" + desktopLinks.join("\n"),
                            user_id: msg.from_id,
                            random_id: easyvk.randomId(),
                            dont_parse_links: 1,
                            keyboard: letyshopsButton,
                        }, 'post')
                    }


                }).catch(() => {

                    vk.call("messages.send", {
                        message: "Список пуст или слишком длинный",
                        user_id: msg.from_id,
                        random_id: easyvk.randomId(),
                    })


                })
            } else if (link.match(/http/g)) {

                getPrice(link, msg.id, msg.from_id).then((res) =>

                    vk.call("messages.send", {
                        message: res + "\nБудем держать Вас в курсе изменений.",
                        user_id: msg.from_id,
                        random_id: easyvk.randomId(),
                        dont_parse_links: 1,
                        keyboard: mainMenu,
                    }), (mistake) =>

                    vk.call("messages.send", {
                        message: mistake,
                        user_id: msg.from_id,
                        random_id: easyvk.randomId(),

                    }))
            } else if (link.match(/newSite/g)) {

                let selectors = link.split(',_');

                let site = selectors[1];
                let title = selectors[2];
                let new_price = selectors[3];
                let meta_title = selectors[4];
                let meta_price = selectors[5];

                restart(site, title, new_price, meta_title, meta_price).then((result) => {

                    console.log(result);

                    result.forEach(e => {
                        getPrice(e.link, e.id, e.user_id).then((res) => {

                            vk.call("messages.send", {
                                message: res + "\nБудем держать Вас в курсе изменений",
                                user_id: e.user_id,
                                random_id: easyvk.randomId(),
                                dont_parse_links: 1
                            });
                        });
                    });

                    vk.call("messages.send", {
                        message: "Новый сайт добавлен!",
                        user_id: 12919128,
                        random_id: easyvk.randomId(),
                        dont_parse_links: 1,
                    });
                });









            } else if (link.match(/findNewPrice/g)) {

                reload().then(() =>
                    vk.call("messages.send", {
                        message: "Перезагрузка началась",
                        user_id: 12919128,
                        random_id: easyvk.randomId(),
                        dont_parse_links: 1
                    }))
            } else if (!link) {


            } else {
                vk.call("messages.send", {
                    message: `Я таких слов не знаю, пришлите мне ссылку на странцу товара, и я буду следить за изменением цены`,
                    user_id: msg.from_id,
                    random_id: easyvk.randomId(),
                    keyboard: errorButtons,


                }, 'post');
            }

        })

    })





})

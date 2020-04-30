const request = require('request');
const fs = require('fs');
const path = require('path');
const jsdom = require('jsdom');
const { JSDOM } = jsdom;
const mysql = require('mysql');


async function getSite(site) {
    let promise = new Promise((resolve, reject) => {
        const connection = mysql.createConnection({
            host: "localhost",
            user: "root",
            database: 'mysql',
            password: "M8o9gbojm8o9gbojm8o9gboj"
        });
        
        connection.connect();
          connection.query(`SELECT * FROM sites WHERE site="${site}"`, function (error, results, fields) {
           if (error) { console.log('Сайта нет'+site); reject("Сайта нет");}
           
           if (results.length == 0) reject("Сайта нет в списке");

            
           resolve (results);
           });
        connection.end();
        
      });
    
      let results = await promise;
      return results;

}




function getPrice(link, id, user_id ) {
let promise = new Promise(function (resolve, reject) {

    request(link, (err, res, body) => {
        if (err) { console.log(err); return; }
        const url  = new URL(link);
        const site = url.hostname;
        console.log(site);
        const dom = new JSDOM(body);
        let price ="";
        let title ="—";

        getSite(site).then((selectors)=> {
            
            try {
                if (selectors[0].meta_price == "content"){
                    price = dom.window.document.querySelector(selectors[0].new_price).content;
                } else if(selectors[0].meta_price == "text"){
                    let reg = new  RegExp(`${selectors[0].new_price}...............`);
                   
                    let preprice=body.match(reg)|| [];
                    price = preprice[0];
                    console.log(price);
                    

                } else {
                    price = dom.window.document.querySelector(selectors[0].new_price).innerHTML;
                }


                if(selectors[0].meta_title){
                    title = dom.window.document.querySelector(selectors[0].title).content;
                } else {
                    title = dom.window.document.querySelector(selectors[0].title).innerHTML;
                }
               
           } catch (error) { 
              
              console.log('Старый магаз шалит или ссылка гной'+site); 
               resolve(`Мы знакомы ${site}, но что-то не так (возможно ссылка не одна, или она ведет не на страницу с товаром). Попробуем разобраться`);
        
        }
        
        },(err)=> {
            console.log('Новый магазин '+site);
            
            
        }).then(()=>{

            if(!price) {
                fs.writeFile(path.join(__dirname+'/newSites', `${site.split('.').join('_')}.html`), body, (err) =>{
                    
                });
                resolve(`Мы еще не работали с ${site}, но через пару дней начнем отслеживание. Вашу ссылку мы сохранили`);
        }
        price = price.replace(/[,.]\d./, " "); // почка или запятая, после которой цифра и любой знак удаляются (убираем копейки)
        price = price.replace(/\s\d+/g, "");   // пробел  и цифры после него удаляются 
        price = price.replace(/\D+/g, "");//оставляем только цифры

        title = title.replace(/[,|-].*/g, ''); // удаляем всё после запятой вместе с запятой, даже если нет ничего после запятой
        title = title.replace(/[\r\n]+/g, '');
        title = title.replace(/ {1,}/g," ");
        
        if ( title.length>77){
            let a=title.split(''); 
            let b=[];
            for(i=0; b.length<75; i++){
                b.push(a[i]);
            }
            title = b.join('')+'…';
        }
        
          


        addLink(link, price, title,  id, user_id);
        resolve(`${title} стоимостью ${price}₽ из магазина ${site}`);    
        function addLink(link, price, title,  id, user_id) {
            const connection = mysql.createConnection({
                host: "localhost",
                user: "root",
                database: 'mysql',
                password: "M8o9gbojm8o9gbojm8o9gboj"
            });
                       
            connection.connect();
            connection.query(`INSERT INTO links (id, link, old_price, new_price, user_id, title, site) VALUES ('${id}', '${link}', '${price}', '${price}', '${user_id}', '${title}', '${site}')`, function (error, results, fields) {
            if (error) throw error;
            
            });
            connection.end();

        }
        });

        

        
    });
})
return promise;
}

module.exports = getPrice;




  /*
        fs.writeFile(path.join(__dirname, 'ostifn.html'), body, (err) => {
            if (err) {
                console.log('error', err); return;
            }
            console.log("file done!");
    
        })
        



       CREATE TABLE sites (site TEXT, title TEXT, old_price TEXT, new_price TEXT);
       INSERT INTO sites (site, title, old_price, new_price) VALUES ('ostin.com', '.o-product__title', '.o-product__price.old', '.o-product__price');
       ALTER TABLE links ADD COLUMN user_id TEXT;
       

       */
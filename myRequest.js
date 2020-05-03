async function myRequest(string) {
    let promise = new Promise((resolve, reject) => {
        const connection = mysql.createConnection({
            host: "localhost",
            user: "root",
            database: 'mysql',
            password: "M8o9gbojm8o9gbojm8o9gboj"
        });

        connection.connect();
        connection.query(string, function (error, results, fields) {
            if (error) { console.log('Сайта нет' + site); reject("Сайта нет"); }

            if (results.length == 0) reject("Сайта нет в списке");


            resolve(results);
        });
        connection.end();

    });

    let results = await promise;
    return results;

}









module.exports = myRequest;
const fs = require("fs");
const { mkdir } = require("fs/promises");
const { Readable } = require('stream');
const { finished } = require('stream/promises');
const path = require("path");

const ip = "131.107.5.103";
const server = `http://${ip}:3000/getpdf/`;
const file1 = "664999";
const file2 = "388940";

const downloadFile = (async (url, folder = ".") => {
    const res = await fetch(url);
    if (!fs.existsSync("docs")) await mkdir("docs");
    const destination = path.resolve("./docs", folder);
    const fileStream = fs.createWriteStream(destination, { flags: 'wx' });
    await finished(Readable.fromWeb(res.body).pipe(fileStream));
    return res.status === 200 ? true : false;
});

const generarID = () => {
    return Math.floor(Math.random() * 1000000) + 1;
}

const main = async () => {
    let i = 0;
    let tiempoInicio = Date.now();
    let flag = true;
    const args = process.argv.slice(2)[0].split("=")[1];
    const tiempoFinal = args === "1" ? 300000 :  // 5 minutos
                        args === "2" ? 600000 :  // 10 minutos
                        args === "3" ? 1800000 : // 30 minutos
                        args === "4" ? 3600000 : // 1 hora
                        300000;                  // 5 minutos
    console.log(
        args === "1" ? "5 minutos" :
        args === "2" ? "10 minutos" :
        args === "3" ? "30 minutos" :
        args === "4" ? "1 hora" :
        "5 minutos"
    );
    do {
        if (i % 2 === 0) {
            const result = await downloadFile(`${server}${file1}`, `${generarID()}-${generarID()}.pdf`);
            if(!result){
                console.log("ERROR"); break;
            }
            console.log(`Termino pdf300mb ${i + 1}`);
        } else {
            const result = await downloadFile(`${server}${file2}`, `${generarID()}-${generarID()}.pdf`);
            if(!result){
                console.log("ERROR"); break;
            }
            console.log(`Termino pdf300mb ${i + 1}`);
        }
        i++;
        let tiempoActual = Date.now();
        let diferencia = tiempoActual - tiempoInicio;
        if (diferencia / tiempoFinal > 1) flag = false;
    } while (flag);
    console.log("TERMINÓ");
}

main();
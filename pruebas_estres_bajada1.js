const cassandra = require('cassandra-driver');
const fs = require('fs');
const keyspace = 'files';
let contactPoints = ["35.203.3.216"];
// let authProvider = new cassandra.auth.PlainTextAuthProvider('cassandra', 'cassandra');
let client = new cassandra.Client({
  contactPoints,
  keyspace,
  localDataCenter: 'datacenter1',
  // authProvider,
  socketOptions: {
    readTimeout: 3600000,
    // readTimeout: 0,
  },
});

const generarRandom = () => {
    return Math.floor(Math.random() * 1000000) + 1;
}

const getPdfChunks = async (idPdf) => {
    const query = "SELECT data FROM pdfs WHERE id_pdf = ? ORDER BY chunk ASC";
    const result = await client.execute(query, [idPdf]);

    if (result.hasError) {
        throw new Error(result.error);
    }

    return result.rows;
}

const assemblePdf = async (idPdf, chunks) => {
    const pdfFile = fs.createWriteStream(`${generarRandom()}-${idPdf}-from-database.pdf`);

    for (const chunk of chunks) {
        pdfFile.write(chunk.data);
    }

    pdfFile.close();
}

const savePdfInServer = async (idPdf) => {
    const chunks = await getPdfChunks(idPdf);
    await assemblePdf(idPdf, chunks);
}

const pdf100Mb = async () => {
    try {
        await savePdfInServer('873309');
        console.log("Descarga de pdf 100mb");
    } catch (error) {
        console.log(`Error en descargar pdf 100 MB ${error}`)
    }
}

const pdf300Mb = async () => {
    try {
        await savePdfInServer('127314');
        console.log("Descarga de pdf 300mb");
    } catch (error) {
        console.log(`Error en descargar pdf 300MB ${error}`)
    }
}

const main = async () => {
    let i = 0;
    let tiempoInicio = Date.now();
    let flag = true;
    do {
        if (i % 2 === 0) {
            await pdf100Mb();
        } else {
            await pdf300Mb();
        }
        i++;
        // Pausa hasta la siguiente marca de tiempo
        let tiempoActual = Date.now();
        let diferencia = tiempoActual - tiempoInicio;
        // if (diferencia / 3600000 > 1) flag = false; // 1 hora
        // if (diferencia / 600000 > 1) flag = false; // 10 minutos
        if (diferencia / 300000 > 1) flag = false; // 5 minutos
    } while (flag);
    console.log("TERMINÓ");
}

main();
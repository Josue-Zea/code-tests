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

const generarID = () => {
    return Math.floor(Math.random() * 1000000) + 1;
}

const splitPdf = (filePath, chunkSize = 1024 * 1024) => {
    return new Promise((resolve, reject) => {
        // Leer el archivo en memoria
        fs.readFile(filePath, (err, data) => {
            if (err) {
                reject(err);
                return;
            }

            // Obtener el tamaño total del archivo
            const fileSize = data.length;

            // Calcular el número total de pedazos
            const totalChunks = Math.ceil(fileSize / chunkSize);

            // Array para almacenar los pedazos del archivo
            const fileChunks = [];

            // Dividir el archivo en pedazos de 1MB y guardarlos en el array
            for (let i = 0; i < totalChunks; i++) {
                const start = i * chunkSize;
                const end = (i + 1) * chunkSize;
                const chunk = data.slice(start, end);
                fileChunks.push(chunk);
            }

            // Resolver la promesa con el array de pedazos
            resolve(fileChunks);
        });
    });
}

const saveMetadata = async (idPdf, name, size) => {
    await client.execute(
        "INSERT INTO documentos (id, name, size) VALUES (?, ?, ?)",
        [idPdf, name, size]
    );
}

const saveChunk = async (id, chunk_number, chunk) => {
    await client.execute(
        "INSERT INTO pdfs (id_pdf, chunk, data) VALUES (?, ?, ?)",
        [id, chunk_number, chunk],
        { prepare: true }
    );
}

const savePdfInDatabase = async (namePdf) => {
    // Carga el archivo PDF.
    const pdfFile = fs.readFileSync(namePdf);

    // Divide el PDF en pedazos de 1 MB.
    const chunks = await splitPdf(namePdf);

    // Generamos el id del nuevo pdf
    const id = `${generarID()}`;

    // Guarda los pedazos del PDF en la tabla de datos.
    for (let i = 0; i < chunks.length; i++) {
        await saveChunk(id, i + 1, chunks[i]);
    }

    // Guarda los metadatos del PDF en la tabla de metadatos.
    await saveMetadata(id, namePdf, pdfFile.length);
}

const pdf100Mb = async () => {
    try {
        await savePdfInDatabase('3.pdf');
    } catch (error) {
        console.log("Error en subir pdf 100 MB")
    }
}

const pdf300Mb = async () => {
    try {
        await savePdfInDatabase('3.5.pdf');
    } catch (error) {
        console.log("Error en subir pdf 300MB")
    }
}

const main = async () => {
    let i = 0;
    let tiempoInicio = Date.now();
    let flag = true;
    do {
        if (i % 2 === 0) {
            await pdf100Mb();
            console.log(`Cargado pdf 100 mb, documentos subidos: ${i + 1 }`);
        } else {
            await pdf300Mb();
            console.log(`Cargado pdf 300 mb, documentos subidos: ${i + 1 }`);
        }
        i++;

        // Pausa hasta la siguiente marca de tiempo
        let tiempoActual = Date.now();
        let diferencia = tiempoActual - tiempoInicio;
        // if (diferencia / 3600000 > 1) flag = false; // 1 hora
        if (diferencia / 600000 > 1) flag = false; // 10 minutos
        // if (diferencia / 300000 > 1) flag = false; // 5 minutos
    } while (flag);
    console.log("TERMINÓ");
}

main();
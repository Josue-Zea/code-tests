const ip = "131.107.5.103";
const server = `http://${ip}:3000/loadpdf/`;
const file1 = "3.pdf";
const file2 = "3.5.pdf";

async function fetchWithTimeout (resource, options = {}) {
    const timeout = 10 * 60 * 1000;

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    const response = await fetch( resource, {
        ...options,
        signal: controller.signal
    })
    clearTimeout(id);

    return response;
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
            await fetchWithTimeout(`server${file1}`);
            console.log(`Termino pdf100mb ${i+1}`);
        } else {
            await fetchWithTimeout(`server${file1}`);
            console.log(`Termino pdf300mb ${i+1}`);
        }
        i++;
        let tiempoActual = Date.now();
        let diferencia = tiempoActual - tiempoInicio;
        if (diferencia / tiempoFinal > 1) flag = false;
    } while (flag);
    console.log("TERMINÓ");
}

main();
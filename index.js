const { parse } = require("node-html-parser");
const fs = require("fs");
const request = require("request");
const webp = require("webp-converter");
const rl = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});

let url;

const path = "./series";

const numberFormat = new Intl.NumberFormat("fr-FR", {
  minimumIntegerDigits: 2,
});
const f = numberFormat.format;

const main = async () => {
  if (!fs.existsSync(path)) fs.mkdirSync(path);

  const res = await fetch(url).then((res) => res.text());
  const document = parse(res);

  const name = document.querySelector("h1").innerText;
  const numero = document.querySelector("h2").innerText.match(/\d+/g)[0];

  const urls = Array.from(document.querySelectorAll("#main-container img")).map((e) => e.attributes["data-src"]);
  const folderSeries = `./${path}/${name}`;
  if (!fs.existsSync(folderSeries)) fs.mkdirSync(folderSeries);
  const folder = `${folderSeries}/${numero}`;
  if (fs.existsSync(folder)) return console.log(`${name} : ${numero} déjà dl`);
  fs.mkdirSync(folder);
  const download = downloader(folder);
  await Promise.all(urls.map(download));
  console.log(`download end`);
};

const downloader = (folder) => {
  return async (value, index) => {
    let options = {
      rejectUnauthorized: false,
      method: "GET",
      url: value,
      headers: {
        Referer: url,
      },
    };

    const path = `${folder}/${f(index + 1)}.webp`;

    request(options)
      .pipe(fs.createWriteStream(path))
      .on("close", () => {
        webp.dwebp(path, `${folder}/${f(index + 1)}.jpg`, "-o", (logging = "-v")).finally(() => fs.rmSync(path));
      });
  };
};

rl.question("Entrez url : ", (id) => {
  url = id;
  main();
  rl.close();
});

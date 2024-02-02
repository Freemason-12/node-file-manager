import * as readline from 'node:readline/promises';
import { stdin as input, stdout as output, argv } from 'node:process';
import { Readable , Writable } from 'node:stream'
import { readdir } from 'node:fs/promises'
import fs from 'node:fs'
import os from 'node:os'

function color(str, color, bold) {
  const Reset = "\x1b[0m"
  const Bright = "\x1b[1m"
  const Dim = "\x1b[2m"
  const Underscore = "\x1b[4m"
  const Blink = "\x1b[5m"
  const Reverse = "\x1b[7m"
  const Hidden = "\x1b[8m"

  const FgBlack = "\x1b[30m"
  const FgRed = "\x1b[31m"
  const FgGreen = "\x1b[32m"
  const FgYellow = "\x1b[33m"
  const FgBlue = "\x1b[34m"
  const FgMagenta = "\x1b[35m"
  const FgCyan = "\x1b[36m"
  const FgWhite = "\x1b[37m"
  const FgGray = "\x1b[90m"

  const BgBlack = "\x1b[40m"
  const BgRed = "\x1b[41m"
  const BgGreen = "\x1b[42m"
  const BgYellow = "\x1b[43m"
  const BgBlue = "\x1b[44m"
  const BgMagenta = "\x1b[45m"
  const BgCyan = "\x1b[46m"
  const BgWhite = "\x1b[47m"
  const BgGray = "\x1b[100m"

  const res = (c) => `${c}${bold ? Bright : ''}${str}${Reset}`;

  switch(color) {
    case 'Bright': return res(Bright);
    case 'Dim' : return res(Dim);
    case 'Underscore' : return res(Underscore);
    case 'Blink' : return res(Blink);
    case 'Reverse' : return res(Reverse);
    case 'Hidden' : return res(Hidden);

    case 'FgBlack' : return res(FgBlack, bold);
    case 'FgRed' : return res(FgRed, bold);
    case 'FgGreen' : return res(FgGreen, bold);
    case 'FgYellow' : return res(FgYellow, bold);
    case 'FgBlue' : return res(FgBlue, bold);
    case 'FgMagenta' : return res(FgMagenta, bold);
    case 'FgCyan' : return res(FgCyan, bold);
    case 'FgWhite' : return res(FgWhite, bold);
    case 'FgGray' : return res(FgGray, bold);

    case 'BgBlack' : return res(BgBlack, bold);
    case 'BgRed' : return res(BgRed, bold);
    case 'BgGreen' : return res(BgGreen, bold);
    case 'BgYellow' : return res(BgYellow, bold);
    case 'BgBlue' : return res(BgBlue, bold);
    case 'BgMagenta' : return res(BgMagenta, bold);
    case 'BgCyan' : return res(BgCyan, bold);
    case 'BgWhite' : return res(BgWhite, bold);
    case 'BgGray' : return res(BgGray, bold);
  }
  return str;
}

let currentDir = os.homedir();


async function ls(dir) {
  const content = await readdir(dir, { withFileTypes: true })
  const maxLength = Math.max(...content.map(x => x.name.length));

  const directories = content.filter(x => x.isDirectory())
  const files = content.filter(x => !x.isDirectory())

  const showInConsole = (files) => {
    for(const file of files) {
      const isDir = file.isDirectory();

      const gap = ' '.repeat(maxLength - file.name.length);
      const fileName = (isDir ?
                        color(file.name, 'FgGreen', true) :
                        color(file.name, 'FgGray', false)) + gap;

      const Dir = isDir ? color('dir/', 'FgBlue') : color('file', 'FgGray');
      console.log(fileName, Dir);
    }
  }

  showInConsole(directories)
  showInConsole(files)
}

function cd(dir) {
  const dirtree = currentDir.split('/');
  const path = dir.split('/');
  while(path[path.length - 1] === '') path.pop();
  let pathExists = true;
  for(let i of path) {
    const possibleDir = dirtree.join('/') + `/${i}`
    // console.log(possibleDir)
    if(i === '..') dirtree.pop();
    else if(i === '.') continue;
    else if(fs.existsSync(possibleDir)) {
      if(fs.statSync(possibleDir).isFile()) {
        console.log(`"${possibleDir}" is a file`);
        pathExists = false;
        break;
      } else dirtree.push(i);
    } else {
      console.log(`"${dirtree.join('/')}/${i}" no such file or directory`);
      pathExists = false;
      break;
    }
  }
  // console.log(dirtree)
  if(pathExists) currentDir = dirtree.join('/');
}

async function cat(filepath) {
  const dirBackup = currentDir;
  const lastIndex = filepath.lastIndexOf('/')
  if(lastIndex !== -1) cd(filepath.slice(0, lastIndex));

  const fullpath = (lastIndex !== -1) ?
        currentDir + `/${filepath.slice(lastIndex)}` :
        currentDir + `/${filepath}`;

  if(!fs.statSync(fullpath).isFile()) {
    console.log(`"${fullpath}" is not a file`);
    currentDir = dirBackup;
    return;
  }

  currentDir = dirBackup;
  const file = fs.createReadStream(fullpath);
  file.setEncoding('utf8');
  for await(const chunk of file) console.log(chunk);
}

async function add(filename) {
  if(filename.indexOf('/') !== -1) { console.log('filename cannot include slashes'); return; }
  fs.writeFile(currentDir + `/${filename}`, '', ()=>{});
}


async function main() {
  const rl = readline.createInterface({ input, output });

  console.log(`Welcome to the File Manager ${argv[2].slice(11)}`)

  let userInput = ''
  while(userInput !== 'exit') {
    userInput = await rl.question('');
    const command = userInput.split(' ');
    switch (command[0]) {
      case 'ls': ls(currentDir); break;
      case 'cd': cd(command[1]); break;
      case 'up': cd('../'); break;
      case 'cat': cat(command[1]); break;
      case 'add': add(command[1]); break;
      default: console.log(`"${command[0]}" command not found`); break;
    }
  }

  rl.close()
} main()

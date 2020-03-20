import Prsi from "./prsi"

const prsi = new Prsi();
prsi.registerPlayer("Lada");
prsi.registerPlayer("Frajer");
prsi.registerPlayer("Vasek");
prsi.newGame();
console.log(prsi.instruction());



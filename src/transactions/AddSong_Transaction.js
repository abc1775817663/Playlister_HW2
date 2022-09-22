import jsTPS_Transaction from "../common/jsTPS.js"

export default class AddSong_Transaction extends jsTPS_Transaction {
    constructor(initApp) {
        super();
        this.app = initApp;
    }

    doTransaction() {
        this.app.addNewSong();
    }
    
    undoTransaction() {
        let list = this.app.state.currentList;
        // console.log(list.songs);
        list.songs.pop();
        // console.log(list.songs);
        this.app.setStateWithUpdatedList(list);
    }
}
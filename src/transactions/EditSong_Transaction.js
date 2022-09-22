import jsTPS_Transaction from "../common/jsTPS.js"

export default class EditSong_Transaction extends jsTPS_Transaction {
    constructor(initApp, newInfo, currentSongNum) {
        super();
        this.app = initApp;
        this.newInfo = newInfo;
        this.currentSongNum = currentSongNum;
        this.prevInfo = null;
    }

    doTransaction() {
        if (! this.prevInfo){
            this.prevInfo = this.app.state.currentList.songs[this.currentSongNum-1];
        }
        this.app.editMarkedSong(this.newInfo, this.currentSongNum);
    }
    
    undoTransaction() {
        this.app.editMarkedSong(this.prevInfo, this.currentSongNum);
    }
}
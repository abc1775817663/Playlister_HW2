import jsTPS_Transaction from "../common/jsTPS.js"

export default class DeleteSong_Transaction extends jsTPS_Transaction {
    constructor(initApp, num) {
        super();
        this.num = num;
        this.app = initApp;
        this.songInfo = null;
        this.showModal = true;


    }

    doTransaction() {
        if (!this.songInfo){
            this.songInfo = this.app.state.currentList.songs[this.num-1];
        }
        if (this.showModal){
            this.app.markSongForDeletion(this.num);
        }
        else{
            this.app.deleteSongWithIndex(this.num-1);
        }
        this.showModal = false;
        
    }
    
    undoTransaction() {
        let list = this.app.state.currentList;
        list.songs.splice(this.num-1, 0, this.songInfo);
        this.app.setStateWithUpdatedList(list);
    }
}
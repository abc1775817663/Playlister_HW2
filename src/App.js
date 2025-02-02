import React from 'react';
import './App.css';

// IMPORT DATA MANAGEMENT AND TRANSACTION STUFF
import DBManager from './db/DBManager';
import jsTPS from './common/jsTPS.js';

// OUR TRANSACTIONS
import MoveSong_Transaction from './transactions/MoveSong_Transaction.js';
import EditSong_Transaction from './transactions/EditSong_Transaction';
import DeleteSong_Transaction from './transactions/DeleteSong_Transaction';
import AddSong_Transaction from './transactions/AddSong_Transaction';

// THESE REACT COMPONENTS ARE MODALS
import DeleteListModal from './components/DeleteListModal.js';

// THESE REACT COMPONENTS ARE IN OUR UI
import Banner from './components/Banner.js';
import EditToolbar from './components/EditToolbar.js';
import PlaylistCards from './components/PlaylistCards.js';
import SidebarHeading from './components/SidebarHeading.js';
import SidebarList from './components/SidebarList.js';
import Statusbar from './components/Statusbar.js';
import DeleteSongModal from './components/DeleteSongModal.js'
import EditSongModal from './components/EditSongModal';


class App extends React.Component {
    constructor(props) {
        super(props);

        // THIS IS OUR TRANSACTION PROCESSING SYSTEM
        this.tps = new jsTPS();

        // THIS WILL TALK TO LOCAL STORAGE
        this.db = new DBManager();

        // GET THE SESSION DATA FROM OUR DATA MANAGER
        let loadedSessionData = this.db.queryGetSessionData();

        // SETUP THE INITIAL STATE
        this.state = {
            modalOpen: false,
            currentSongNum: null,
            listKeyPairMarkedForDeletion : null,
            currentList : null,
            sessionData : loadedSessionData
        }
        
    }
    addReDoAndUnDoShortCut(){
        function KeyPress(evtobj, app) {
            if (!app.state.modalOpen){
            
                if (evtobj.key == "z" && evtobj.ctrlKey){
                    app.undo();
                    app.setStateWithUpdatedList(app.state.currentList);
                }
                if (evtobj.key == "y" && evtobj.ctrlKey){
                    app.redo();
                    app.setStateWithUpdatedList(app.state.currentList);
                } 
            }
        }
        
        document.onkeydown = (e) => KeyPress(e,this);
    }
    sortKeyNamePairsByName = (keyNamePairs) => {
        keyNamePairs.sort((keyPair1, keyPair2) => {
            // GET THE LISTS
            return keyPair1.name.localeCompare(keyPair2.name);
        });
    }
    // THIS FUNCTION BEGINS THE PROCESS OF CREATING A NEW LIST
    createNewList = () => {
        // FIRST FIGURE OUT WHAT THE NEW LIST'S KEY AND NAME WILL BE
        let newKey = this.state.sessionData.nextKey;
        let newName = "Untitled" + newKey;

        // MAKE THE NEW LIST
        let newList = {
            key: newKey,
            name: newName,
            songs: []
        };

        // MAKE THE KEY,NAME OBJECT SO WE CAN KEEP IT IN OUR
        // SESSION DATA SO IT WILL BE IN OUR LIST OF LISTS
        let newKeyNamePair = { "key": newKey, "name": newName };
        let updatedPairs = [...this.state.sessionData.keyNamePairs, newKeyNamePair];
        this.sortKeyNamePairsByName(updatedPairs);

        // CHANGE THE APP STATE SO THAT THE CURRENT LIST IS
        // THIS NEW LIST AND UPDATE THE SESSION DATA SO THAT THE
        // NEXT LIST CAN BE MADE AS WELL. NOTE, THIS setState WILL
        // FORCE A CALL TO render, BUT THIS UPDATE IS ASYNCHRONOUS,
        // SO ANY AFTER EFFECTS THAT NEED TO USE THIS UPDATED STATE
        // SHOULD BE DONE VIA ITS CALLBACK
        this.setState(prevState => ({
            modalOpen: prevState.modalOpen,
            currentSongNum: prevState.currentSongNum,
            listKeyPairMarkedForDeletion : prevState.listKeyPairMarkedForDeletion,
            currentList: newList,
            sessionData: {
                nextKey: prevState.sessionData.nextKey + 1,
                counter: prevState.sessionData.counter + 1,
                keyNamePairs: updatedPairs
            }
        }), () => {
            // PUTTING THIS NEW LIST IN PERMANENT STORAGE
            // IS AN AFTER EFFECT
            this.db.mutationCreateList(newList);

            // SO IS STORING OUR SESSION DATA
            this.db.mutationUpdateSessionData(this.state.sessionData);
        });
    }
    // THIS FUNCTION BEGINS THE PROCESS OF DELETING A LIST.
    deleteList = (key) => {
        // IF IT IS THE CURRENT LIST, CHANGE THAT
        let newCurrentList = null;
        if (this.state.currentList) {
            if (this.state.currentList.key !== key) {
                // THIS JUST MEANS IT'S NOT THE CURRENT LIST BEING
                // DELETED SO WE'LL KEEP THE CURRENT LIST AS IT IS
                newCurrentList = this.state.currentList;
            }
        }

        let keyIndex = this.state.sessionData.keyNamePairs.findIndex((keyNamePair) => {
            return (keyNamePair.key === key);
        });
        let newKeyNamePairs = [...this.state.sessionData.keyNamePairs];
        if (keyIndex >= 0)
            newKeyNamePairs.splice(keyIndex, 1);

        // AND FROM OUR APP STATE
        this.setState(prevState => ({
            modalOpen: prevState.modalOpen,
            currentSongNum: null,
            listKeyPairMarkedForDeletion : null,
            currentList: newCurrentList,
            sessionData: {
                nextKey: prevState.sessionData.nextKey,
                counter: prevState.sessionData.counter - 1,
                keyNamePairs: newKeyNamePairs
            }
        }), () => {
            // DELETING THE LIST FROM PERMANENT STORAGE
            // IS AN AFTER EFFECT
            this.db.mutationDeleteList(key);

            // SO IS STORING OUR SESSION DATA
            this.db.mutationUpdateSessionData(this.state.sessionData);
        });
    }
    deleteMarkedList = () => {
        this.deleteList(this.state.listKeyPairMarkedForDeletion.key);
        this.hideDeleteListModal();
    }

    deleteMarkedSong = () => {
        this.deleteSong();
        this.hideDeleteSongModal();
    }

    editMarkedSong = (newInfo, currentSongNum) => {
        const {currentList} = this.state;

        currentList.songs[currentSongNum - 1] = newInfo;
        this.setStateWithUpdatedList(currentList);

        this.hideEditSongModal();
    }

    // THIS FUNCTION SPECIFICALLY DELETES THE CURRENT LIST
    deleteCurrentList = () => {
        if (this.state.currentList) {
            this.deleteList(this.state.currentList.key);
        }
    }
    renameList = (key, newName) => {
        let newKeyNamePairs = [...this.state.sessionData.keyNamePairs];
        // NOW GO THROUGH THE ARRAY AND FIND THE ONE TO RENAME
        for (let i = 0; i < newKeyNamePairs.length; i++) {
            let pair = newKeyNamePairs[i];
            if (pair.key === key) {
                pair.name = newName;
            }
        }
        this.sortKeyNamePairsByName(newKeyNamePairs);

        // WE MAY HAVE TO RENAME THE currentList
        let currentList = this.state.currentList;
        if (currentList.key === key) {
            currentList.name = newName;
        }

        this.setState(prevState => ({
            modalOpen: prevState.modalOpen,
            currentSongNum: null,
            listKeyPairMarkedForDeletion : null,
            sessionData: {
                nextKey: prevState.sessionData.nextKey,
                counter: prevState.sessionData.counter,
                keyNamePairs: newKeyNamePairs
            }
        }), () => {
            // AN AFTER EFFECT IS THAT WE NEED TO MAKE SURE
            // THE TRANSACTION STACK IS CLEARED
            let list = this.db.queryGetList(key);
            list.name = newName;
            this.db.mutationUpdateList(list);
            this.db.mutationUpdateSessionData(this.state.sessionData);
        });
    }
    // THIS FUNCTION BEGINS THE PROCESS OF LOADING A LIST FOR EDITING
    loadList = (key) => {
        let newCurrentList = this.db.queryGetList(key);
        this.setState(prevState => ({
            modalOpen: prevState.modalOpen,
            currentSongNum: prevState.currentSongNum,
            listKeyPairMarkedForDeletion : prevState.listKeyPairMarkedForDeletion,
            currentList: newCurrentList,
            sessionData: this.state.sessionData
        }), () => {
            // AN AFTER EFFECT IS THAT WE NEED TO MAKE SURE
            // THE TRANSACTION STACK IS CLEARED
            this.tps.clearAllTransactions();
            this.setStateWithUpdatedList(this.state.currentList);
        });
    }
    // THIS FUNCTION BEGINS THE PROCESS OF CLOSING THE CURRENT LIST
    closeCurrentList = () => {
        this.tps.clearAllTransactions();
        this.setState(prevState => ({
            modalOpen: prevState.modalOpen,
            currentSongNum : prevState.currentSongNum,
            listKeyPairMarkedForDeletion : prevState.listKeyPairMarkedForDeletion,
            currentList: null,
            sessionData: this.state.sessionData
        }), () => {
            // AN AFTER EFFECT IS THAT WE NEED TO MAKE SURE
            // THE TRANSACTION STACK IS CLEARED
            // this.tps.clearAllTransactions();
        });
    }

    addNewSong = () => {
        let list = this.state.currentList
        list.songs.push({title: "Untitled", artist: "Unknown", youTubeId: "dQw4w9WgXcQ" });
        this.setStateWithUpdatedList(list);

    }
    setStateWithUpdatedList(list) {
        this.setState(prevState => ({
            modalOpen: prevState.modalOpen,
            currentSongNum: prevState.currentSongNum,
            listKeyPairMarkedForDeletion : prevState.listKeyPairMarkedForDeletion,
            currentList : list,
            sessionData : this.state.sessionData
        }), () => {
            // UPDATING THE LIST IN PERMANENT STORAGE
            // IS AN AFTER EFFECT
            this.db.mutationUpdateList(this.state.currentList);
        });
    }
    setStateWithUpdatedModalOpen(isModalOpen) {
        this.setState(prevState => ({
            modalOpen: isModalOpen,
            currentSongNum: prevState.currentSongNum,
            listKeyPairMarkedForDeletion : prevState.listKeyPairMarkedForDeletion,
            currentList : prevState.currentList,
            sessionData : this.state.sessionData
        }));
    }
    getPlaylistSize = () => {
        return this.state.currentList.songs.length;
    }
    // THIS FUNCTION MOVES A SONG IN THE CURRENT LIST FROM
    // start TO end AND ADJUSTS ALL OTHER ITEMS ACCORDINGLY
    moveSong(start, end) {
        let list = this.state.currentList;

        // WE NEED TO UPDATE THE STATE FOR THE APP
        start -= 1;
        end -= 1;
        if (start < end) {
            let temp = list.songs[start];
            for (let i = start; i < end; i++) {
                list.songs[i] = list.songs[i + 1];
            }
            list.songs[end] = temp;
        }
        else if (start > end) {
            let temp = list.songs[start];
            for (let i = start; i > end; i--) {
                list.songs[i] = list.songs[i - 1];
            }
            list.songs[end] = temp;
        }
        this.setStateWithUpdatedList(list);
    }
    // THIS FUNCTION ADDS A MoveSong_Transaction TO THE TRANSACTION STACK
    addMoveSongTransaction = (start, end) => {
        let transaction = new MoveSong_Transaction(this, start, end);
        this.tps.addTransaction(transaction);
    }
    addAddSongTransaction = () => {
        let transaction = new AddSong_Transaction(this);
        this.tps.addTransaction(transaction);
    }
    addEditSongTransaction = () => {
        let title = document.getElementById("edit-song-modal-title-textfield").value;
        let artist = document.getElementById("edit-song-modal-artist-textfield").value;
        let youTubeId = document.getElementById("edit-song-modal-youTubeId-textfield").value;
        
        let newInfo = {title: title, artist: artist, youTubeId: youTubeId};

        let transaction = new EditSong_Transaction(this, newInfo, this.state.currentSongNum);
        this.tps.addTransaction(transaction);
    }

    deleteSongTransaction = (num) => {
        let transaction = new DeleteSong_Transaction(this, num);
        this.tps.addTransaction(transaction);
    }

    // A-DELETESONG
    deleteSong = () => {

        this.state.currentList.songs.splice(this.state.currentSongNum-1, 1);

        this.setState(prevState => ({
            modalOpen: prevState.modalOpen,
            currentSongNum: prevState.currentSongNum,
            listKeyPairMarkedForDeletion : prevState.listKeyPairMarkedForDeletion,
            currentList : this.state.currentList,
            sessionData : this.state.sessionData
        }), () => {
            // UPDATING THE LIST IN PERMANENT STORAGE
            // IS AN AFTER EFFECT
            this.db.mutationUpdateList(this.state.currentList);
        });
        
    }

    deleteSongWithIndex = (index) => {

        this.state.currentList.songs.splice(index, 1);

        this.setState(prevState => ({
            modalOpen: prevState.modalOpen,
            currentSongNum: index,
            listKeyPairMarkedForDeletion : prevState.listKeyPairMarkedForDeletion,
            currentList : this.state.currentList,
            sessionData : this.state.sessionData
        }), () => {
            // UPDATING THE LIST IN PERMANENT STORAGE
            // IS AN AFTER EFFECT
            this.db.mutationUpdateList(this.state.currentList);
        });
        
    }
    // THIS FUNCTION BEGINS THE PROCESS OF PERFORMING AN UNDO
    undo = () => {
        if (this.tps.hasTransactionToUndo()) {
            this.tps.undoTransaction();

            // MAKE SURE THE LIST GETS PERMANENTLY UPDATED
            this.db.mutationUpdateList(this.state.currentList);
            
        }
    }
    // THIS FUNCTION BEGINS THE PROCESS OF PERFORMING A REDO
    redo = () => {
        if (this.tps.hasTransactionToRedo()) {
            this.tps.doTransaction();

            // MAKE SURE THE LIST GETS PERMANENTLY UPDATED
            this.db.mutationUpdateList(this.state.currentList);
        }
    }
    markListForDeletion = (keyPair) => {
        this.setState(prevState => ({
            modalOpen: prevState.modalOpen,
            currentSongNum: prevState.currentSongNum,
            currentList: prevState.currentList,
            listKeyPairMarkedForDeletion : keyPair,
            sessionData: prevState.sessionData
        }), () => {
            // PROMPT THE USER
            this.showDeleteListModal();
        });
    }

    markSongForDeletion = (num) => {
        this.setState(prevState => ({
            currentSongNum: num,
            currentList: prevState.currentList,
            listKeyPairMarkedForDeletion : prevState.listKeyPairMarkedForDeletion,
            sessionData: prevState.sessionData
        }), () => {
            // PROMPT THE USER
            this.showDeleteSongModal();
        });
    }

    markSongForEdit = (num) => {
        this.setState(prevState => ({
            modalOpen: prevState.modalOpen,
            currentSongNum: num,
            currentList: prevState.currentList,
            listKeyPairMarkedForDeletion : prevState.listKeyPairMarkedForDeletion,
            sessionData: prevState.sessionData
        }), () => {
            // PROMPT THE USER
            this.showEditSongModal();
        });
    }
    // THIS FUNCTION SHOWS THE MODAL FOR PROMPTING THE USER
    // TO SEE IF THEY REALLY WANT TO DELETE THE LIST
    showDeleteListModal = () => {
        let modal = document.getElementById("delete-list-modal");
        modal.classList.add("is-visible");
        this.setStateWithUpdatedModalOpen(true);
    }
    // THIS FUNCTION IS FOR HIDING THE MODAL
    hideDeleteListModal = () => {
        let modal = document.getElementById("delete-list-modal");
        modal.classList.remove("is-visible");
        this.setStateWithUpdatedModalOpen(false);
    }
    showDeleteSongModal = () => {
        let modal = document.getElementById("delete-song-modal");
        modal.classList.add("is-visible");
        this.setStateWithUpdatedModalOpen(true);
    }
    // THIS FUNCTION IS FOR HIDING THE MODAL
    hideDeleteSongModal = () => {
        let modal = document.getElementById("delete-song-modal");
        modal.classList.remove("is-visible");
        this.setStateWithUpdatedModalOpen(false);
    }
    showEditSongModal = () => {
        let modal = document.getElementById("edit-song-modal");
        modal.classList.add("is-visible");
        this.setStateWithUpdatedModalOpen(true);
    }
    // THIS FUNCTION IS FOR HIDING THE MODAL
    hideEditSongModal = () => {
        let modal = document.getElementById("edit-song-modal");
        modal.classList.remove("is-visible");
        this.setStateWithUpdatedModalOpen(false);
    }




    render() {
        this.addReDoAndUnDoShortCut();

        console.log(this.state.modalOpen);

        if (this.state.modalOpen){
            var canAddSong = false;
            var canUndo = false;
            var canRedo = false;
            var canClose = false;
            var canAddList = false;
        }else{
            var canAddSong = this.state.currentList !== null;
            var canUndo = this.tps.hasTransactionToUndo();
            var canRedo = this.tps.hasTransactionToRedo();
            var canClose = this.state.currentList !== null;
            var canAddList = this.state.currentList == null;
        }



        return (
            <div id="root">
                <Banner />
                <SidebarHeading
                    createNewListCallback={this.createNewList}
                    canAddList={canAddList}
                />
                <SidebarList
                    currentList={this.state.currentList}
                    keyNamePairs={this.state.sessionData.keyNamePairs}
                    deleteListCallback={this.markListForDeletion}
                    loadListCallback={this.loadList}
                    renameListCallback={this.renameList}
                
                />
                <EditToolbar
                    canAddSong={canAddSong}
                    canUndo={canUndo}
                    canRedo={canRedo}
                    canClose={canClose} 
                    undoCallback={this.undo}
                    redoCallback={this.redo}
                    closeCallback={this.closeCurrentList}
                    addCallback={this.addAddSongTransaction}
                />
                <PlaylistCards
                    currentList={this.state.currentList}
                    moveSongCallback={this.addMoveSongTransaction}
                    deleteSongCallback={this.deleteSongTransaction}
                    editSongCallback = {this.markSongForEdit} 
                    />
                <Statusbar 
                    currentList={this.state.currentList} />
                <DeleteListModal
                    listKeyPair={this.state.listKeyPairMarkedForDeletion}
                    hideDeleteListModalCallback={this.hideDeleteListModal}
                    deleteListCallback={this.deleteMarkedList}
                />
                <DeleteSongModal
                    song={this.state.currentList ? 
                        (this.state.currentSongNum? 
                        this.state.currentList.songs[this.state.currentSongNum - 1] : null) :
                        null
                    }
                    hideDeleteSongModalCallback={this.hideDeleteSongModal}
                    deleteSongCallback={this.deleteMarkedSong}
                />
                <EditSongModal
                    song={this.state.currentList ? 
                        (this.state.currentSongNum? 
                        this.state.currentList.songs[this.state.currentSongNum - 1] : null) :
                        null
                    }
                    comfirmEditCallback={this.addEditSongTransaction}
                    hideModalCallback={this.hideEditSongModal}
                />

            </div>
        );
    }
}


export default App;


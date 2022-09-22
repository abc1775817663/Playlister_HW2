import React, { Component } from 'react';

export default class EditSongModal extends Component {
    constructor(props) {
        super(props);

        this.state = {
            song: { ...this.props.song },
            titleChange: null,
            artistChange: null,
            linkChange: null
        };
        
        
       
    }

    handleChangeTitle = (e) => {
        this.state.titleChange = e.target.value;
        this.setState({
            song: this.state.song,
            titleChange: this.state.titleChange,
            artistChange: this.state.artistChange,
            linkChange: this.linkChange
        })
        
    }
    handleChangeArtist= (e) => {
        this.state.artistChange = e.target.value;
        this.setState({
            song: this.state.song,
            titleChange: this.state.titleChange,
            artistChange: this.state.artistChange,
            linkChange: this.linkChange
        })
    }
    handleChangeLink= (e) => {
        this.state.linkChange = e.target.value;
        this.setState({
            song: this.state.song,
            titleChange: this.state.titleChange,
            artistChange: this.state.artistChange,
            linkChange: this.linkChange
        })
    }

    handleCancel = () => {
        this.setState({
            song: this.state.song,
            titleChange: null,
            artistChange: null,
            linkChange: null
        })
        this.props.hideModalCallback();
    }

    handleConfirm = () => {
        this.setState({
            song: this.state.song,
            titleChange: null,
            artistChange: null,
            linkChange: null
        })
        
        this.props.comfirmEditCallback();
    }
    
    render() {
        const { comfirmEditCallback, hideModalCallback } = this.props;

        const { titleChange, artistChange, linkChange } = this.state;


        this.state.song = {... this.props.song};

        let song = this.state.song;

        let songInfoObj = {
            title: "",
            artist: "",
            youTubeId: ""
        };

        if (song) {
            songInfoObj = song;
        }


        return (
            <div
                class="modal" 
                id="edit-song-modal" 
                data-animation="slideInOutLeft">
                    <div class="modal-root" id='verify-edit-song-root'>
                        <div class="modal-north">
                            Edit Song
                        </div>
                        <div class="modal-center">
                            <div class="modal-center-content" id="edit-song-info-div">

                                    <span id="title-prompt">Title:</span>
                                    <input value={titleChange? titleChange : songInfoObj.title} onChange={this.handleChangeTitle} id="edit-song-modal-title-textfield"></input>

                                    <span id="artist-prompt">Artist:</span>
                                    <input value={artistChange? artistChange : songInfoObj.artist} onChange={this.handleChangeArtist} id="edit-song-modal-artist-textfield"></input>

                                    <span id="you-tube-id-prompt">YouTubeId:</span>
                                    <input value={linkChange? linkChange : songInfoObj.youTubeId} onChange={this.handleChangeLink} id="edit-song-modal-youTubeId-textfield"></input>

                                
                            </div>
                        </div>
                        <div class="modal-south">
                            <input type="button" 
                                id="edit-song-confirm-button" 
                                class="modal-button" 
                                onClick={this.handleConfirm}
                                value='Confirm' />
                            <input type="button" 
                                id="edit-song-cancel-button" 
                                class="modal-button" 
                                onClick={this.handleCancel}
                                value='Cancel' />
                        </div>
                    </div>
            </div>
        );
    }
}
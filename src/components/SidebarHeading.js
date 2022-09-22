import React from "react";

export default class SidebarHeading extends React.Component {
    handleClick = (event) => {
        const { createNewListCallback} = this.props;
        createNewListCallback();
    };
    render() {
        let canAddList = this.props.canAddList;
        console.log(canAddList);
        return (
            <div id="sidebar-heading">
                <input 
                    type="button" 
                    id="add-list-button" 
                    className="toolbar-button"
                    disabled={!canAddList}  
                    onClick={this.handleClick}
                    value="+" />
                Your Playlists
            </div>
        );
    }
}
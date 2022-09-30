import React from 'react';
import './triplan-tag.scss';

export interface TagProps {
    text: string,
    onDelete: () => void
}
const TriplanTag = (props: TagProps) => {
    const { text, onDelete } = props;
    return (
        <div className={"triplan-tag"}>
            <span className={"triplan-tag-text"}>{text}</span>
            <span className={"triplan-tag-delete"} onClick={onDelete}>x</span>
        </div>
    )
}

export default TriplanTag;
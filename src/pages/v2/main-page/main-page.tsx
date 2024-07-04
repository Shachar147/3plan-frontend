import React from 'react';
import {observer} from "mobx-react";
import './main-page.scss';
import TriplanHeaderBanner from "./components/triplan-header-banner/triplan-header-banner";


function MainPageV2(){
    return (
        <div className="triplan-main-page-container">
            <TriplanHeaderBanner />
        </div>
    )
}

export default observer(MainPageV2)
import React from 'react';
import {observer} from "mobx-react";
import './main-page.scss';
import TriplanHeaderBanner from "../../components/triplan-header-banner/triplan-header-banner";
import {useHandleWindowResize} from "../../../custom-hooks/use-window-size";
import MainPageContent from "./main-page-content";

function TriplanFooter(){
    return (
        <div className="triplan-footer">test</div>
    )
}

function MainPageV2(){
    useHandleWindowResize();

    return (
        <div className="triplan-main-page-container flex-column">
            <TriplanHeaderBanner />
            <MainPageContent />
            <TriplanFooter />
        </div>
    )
}

export default observer(MainPageV2)
import React from "react";
import PropTypes from "prop-types";
import {LOADER_DETAILS} from "../../utils/utils";

const LoadingPage = (props: {
        title: string,
        message: string,
        loaderDetails: { loader: string, backgroundColor: string, top: string, textColor?: string }
    }) => {
    const loaderDetails = props.loaderDetails || LOADER_DETAILS();

    const textStyle = { fontWeight: "normal", color: "black" }
    if (loaderDetails.textColor){
        textStyle.color = loaderDetails.textColor;
    }

    return (
        <div>
            <div className={"ui header cards centered"} style={
                { width: "100%", height: "100vh", backgroundColor: loaderDetails.backgroundColor }} >
                <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
                    <div>
                        <img src={loaderDetails.loader} alt={""} style={{ width: "100%", maxWidth: "800px" }} />
                        <div className="sub header content" style={
                            {
                                width:"100%",
                                textAlign: "center",
                                top: loaderDetails.top,
                                fontSize: "20px",
                                fontWeight: "bold",
                                position: "relative"
                            }}>
                            <div className="loading-header" style={textStyle}>
                                {props.title}
                            </div>
                            <p style={textStyle} dangerouslySetInnerHTML={{ __html: props.message }} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

LoadingPage.propTypes = {
    /**
     * The title of the loading block.
     */
    title: PropTypes.string,
    /**
     * Descriptive message that will appear under the title.
     */
    message: PropTypes.string,
    /**
     * Hash of loader details:
     *
     * \> loader - loader image path.
     *
     * \> backgroundColor - background color for the page, when this loader is being displayed.
     *
     * \> top - top position for title and description block, when this loader is being displayed.
     *
     * Example:
     * { loader: 'loaders/Klay.gif', backgroundColor: 'white', top: '0px', }
     * .
     */
    loaderDetails: PropTypes.object,
};

LoadingPage.defaultProps = {
    title: "Loading",
    message: "Please wait while loading...",
};

export default LoadingPage;
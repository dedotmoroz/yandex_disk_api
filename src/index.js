import 'core-js/es6/map';
import 'core-js/es6/set';

import React from 'react';
import ReactDOM from 'react-dom';
import Transition from 'react-transition-group/Transition';
import './css/bootstrap.css';
import './css/styles.css';

// Yandex REST API (OAuth 2.0)
const CLIENT_ID = "500dea2d0ffe40e6b2c13cc6f1ae72b6";
// const AUTH_TOKEN =
// "https://oauth.yandex.ru/authorize?response_type=token&client_id=500dea2d0ffe4
// 0e6b2c13cc6f1ae72b6&redirect_uri=https://apps-4-you.com/yadisk/";
const AUTH_TOKEN = "http://localhost:3000/#access_token=AQAAAAAAAThbAATatSm06ZDdvEJ2hprKA2KoB5A&toke" +
        "n_type=bearer&expires_in=30076128";
// Yandex.Disc API
const API_FOLDERS = "https://cloud-api.yandex.net/v1/disk/resources?path=";
const API_FILES = "https://cloud-api.yandex.net/v1/disk/resources/download?path=";
const API_UPLOAD = "https://cloud-api.yandex.net:443/v1/disk/resources/upload?path=";
const API_DELETE = "https://cloud-api.yandex.net:443/v1/disk/resources?path=";

async function API(requests, init) {
    const response = await fetch(requests, init);
    const json = await response.json();
    return json;
}

class App extends React.Component {
constructor(){
    super();
    this.state = {token: ""};
}
    

    componentWillMount() {
        if (document.location.hash) {
            const hash_token = /access_token=([^&]+)/.exec(document.location.hash)[1];
            this.setCookie("token", hash_token);
            this.setState({token: hash_token});
            document.location = document.location.origin + document.location.pathname;
            return;
        }

        const cookie_token = this.getCookie("token");
        if (cookie_token && cookie_token !== 'LOGOUT') {
            this.setState({token: cookie_token});
            return;
        }
    }

    getCookie(name) {
        var matches = document
            .cookie
            .match(new RegExp("(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"));
        return matches
            ? decodeURIComponent(matches[1])
            : undefined;
    }

    setCookie(name, token) {
        var date = new Date();
        date.setDate(date.getDate() + 365);
        const collectCookie = name + "=" + token + "; path=/; expires=" + date;
        document.cookie = collectCookie;
    }

    render() {
        return <div>{this.state.token
                ? <YandexDisk token={this.state.token}/>
                : <Token/>}</div>
    }
}

class YandexDisk extends React.Component {
    constructor() {
        super();
        this.state = {
            folder: [],
            disk: [],
            loading: "hide",
            error: ""
        };
        this.arrayDisk = [];
    }

    getFolder(folder_name = '') {
        this.arrayDisk.length = 0;
        this.preloader('show');
        this.setState({error: ""});
        const folder_path = this
            .state
            .folder
            .join('/')
            .replace('disk:/', '') + '/';
        const FOLDER_URL = API_FOLDERS + folder_path + folder_name + "&limit=10000";
        const headers = new Headers({
            'Authorization': `OAuth ` + this.props.token
        });
        const init = {
            headers: headers
        };

const fetchFolder = async () => {
    const response = await fetch(FOLDER_URL, init);
    const json = await response.json();
    json._embedded.items.map((item, index) => {this.arrayDisk[index] = item;})
    const arrayFolders = json._embedded.path.split("/");
    this.preloader('hide');
    this.setState({disk: this.arrayDisk, folder: arrayFolders});
}

fetchFolder();

    }

    getFile(file_name) {
        const folder_path = this
            .state
            .folder
            .join('/')
            .replace('disk:/', '') + '/';
        const FILE_URL = API_FILES + folder_path + file_name;
        const headers = new Headers({
            'Authorization': `OAuth ` + this.props.token
        });
        const init = {
            headers: headers
        };

const fetchFile = async () => {
const response = await fetch(FILE_URL, init);
const json = await response.json();
window.location = json.href;
this.setState({download: json.href})
}

fetchFile();

    }

    fileList_Add_Del(item_name, add_or_del) {
        let arr = [];
        switch (add_or_del) {
            case 'del':
                arr = this
                    .state
                    .disk
                    .filter(item => {
                        if (item.name !== item_name) 
                            return true;
                        }
                    );
                break;
            case 'add':
                arr = [
                    ...this.state.disk, {
                        name: item_name
                    }
                ];
                break;
        }
        this.setState({disk: arr});
    }

    deleteFile(file_name) {
        const folder_path = this
            .state
            .folder
            .join('/')
            .replace('disk:/', '') + '/';
        const FILE_URL = API_DELETE + folder_path + file_name;
        // console.log('del', FILE_URL);
        const headers = new Headers({
            'Authorization': `OAuth ` + this.props.token
        });
        const init = {
            method: 'DELETE',
            headers: headers
        };

        const deleteItem = async() => {
            this.preloader('show');
            const response = await fetch(FILE_URL, init);
            console.log('del', response.status);
            if (response.status === 204) {
                this.fileList_Add_Del(file_name, 'del');
                this.preloader('hide');
            }
        }

        deleteItem();

    }

    changeFolders(event) {
        event.preventDefault();
        const arrayFolders = event
            .target
            .href
            .split("/");
        this.setState({
            folder: arrayFolders
        }, () => this.getFolder(''));
    }

    preloader(switch_preloader) {
        switch (switch_preloader) {
            case 'hide':
                this.setState({loading: "hide"});
                break;
            case 'show':
                this.setState({loading: "show"});
                break;
        }
    }

    logOut() {
        document.cookie = "token=LOGOUT";
        document.location = document.location.origin + document.location.pathname;
    }

    componentDidMount() {
        this.setState({
            folder: ['disk:/']
        }, () => this.getFolder(''));
    }

    componentWillUnmount() {
        console('componentWillUnmount YandexDisk');
    }

    render() {
        return (
            <React.Fragment>
                <div className="container">
                    <div className="row">
                        <div className="col-md-12">
                            <Preloader loading={this.state.loading}/>
                            <h2>Яндекс Диск</h2>
                            <LogOut
                                linkout={this
                                .logOut
                                .bind(this)}/>
                            <h3>
                                <span className='glyphicon glyphicon-folder-open current-dir'></span>
                                <BreadCrumbs
                                    folder
                                    ={this.state.folder}
                                    link={this
                                    .changeFolders
                                    .bind(this)}/>
                            </h3>
                            <FileUpload
                                folder={this.state.folder}
                                token={this.props.token}
                                fileList_Add={this
                                .fileList_Add_Del
                                .bind(this)}
                                preloader={this
                                .preloader
                                .bind(this)}/>
                            <table className="table table-bordered table-striped table-hover">
                                <tbody>
                                    <BildFileTree
                                        disk={this.state.disk}
                                        folder={this
                                        .getFolder
                                        .bind(this)}
                                        file={this
                                        .getFile
                                        .bind(this)}
                                        delete={this
                                        .deleteFile
                                        .bind(this)}/>
                                </tbody>
                            </table>
                            <h3>{this.state.error}</h3>
                        </div>
                    </div>
                </div>
            </React.Fragment>
        )
    }
}

class FileUpload extends React.Component {
    static defaultProps = {
        token: 'token',
        folder: ['disk:', 'Temp']
    }

    state = {
        buttonLabel: 'Выберите файлы для загрузки',
        buttonClass: 'hidden'
    }


    getUploadLink(event) {
        event.preventDefault();
        const file_on_local_disk = this.fileInput.files[0];
        const file_name = this.fileInput.files[0].name;
        const file_path = this
            .props
            .folder
            .reduce((previousValue, currentItem) => currentItem && (previousValue + '/' + currentItem)) + '/';
        const FOLDER_URL = API_UPLOAD + file_path + file_name + '&overwrite=true';
        const headers = new Headers({
            'Authorization': 'OAuth ' + this.props.token,
            'Content-Type': 'application/json'
        });

        const init = {
            method: 'GET',
            headers: headers
        };

        const formData = new FormData();
        formData.append('file', file_on_local_disk);

        // var myInit = {
        //     method: 'PUT',
        //     body: formData
        // };

        const uploadFile = (async() => {
            this.props.preloader('show');
            const response = await fetch(FOLDER_URL, init);
            const json = await response.json();


            // await fetch(json.href, myInit);
            const dispatch = await uploadXMLHttpRequest(json.href, formData);    
            this.props.fileList_Add(file_name, 'add');
            this.props.preloader('hide');
            this.setState({buttonLabel: 'Выберите файлы для загрузки', buttonClass: 'hidden'});
        })();


        const uploadXMLHttpRequest = function(url, formData){
            const xhr = new XMLHttpRequest();
            // const preloader = new Preloader();
            // preloader.create();
            xhr.upload.onprogress = (event) => {
                // console.log('xhr.upload.onprogress', event);
                let process = parseFloat(event.loaded / event.total) * 100;
                this.setState({loader: process, statys: 'pending'});
            }
            xhr.onload = () =>{
                 //console.log('xhr.onload', event, 'this - ', this, 'xhr.status', xhr);
                //console.log('xhr.status', xhr.status);
                if (xhr.status === 201) {
                this.setState({loader: 100, statys: 'success'});
                    // console.log("success", this.status);
                    // preloader.success();
                } else {
                    // console.log("error " + this.status);
                    // preloader.error(this.status);
                }
            }
            xhr.open('PUT', url);
            xhr.send(formData);
        }.bind(this);

    }

    fileInputChange(event) {
        const buttonText = (event.target.files.length > 0)
            ? `Файл: ${event.target.files[0].name}`
            : `Выберите файл для загрузки`;
        this.setState({buttonLabel: buttonText, buttonClass: ''});
    }

    componentWillUnmount() {
        console('componentWillUnmount FileUpload');
    }

    render() {
        return (
            <div>
                <form
                    id="sentfile"
                    name="uploadfile"
                    onSubmit={this
                    .getUploadLink
                    .bind(this)}>
                    <label htmlFor="fileinput" className="btn btn-link text-uppercase">{this.state.buttonLabel}</label>
                    <input
                        name="file"
                        type="file"
                        ref={input => {
                        this.fileInput = input;
                    }}
                        id="fileinput"
                        className="hidden"
                        multiple="multiple"
                        onChange={this
                        .fileInputChange
                        .bind(this)}/>
                    <Button class={'btn btn-primary text-uppercase ' + this.state.buttonClass}>ЗАГРУЗИТЬ</Button>
                </form>
                   <PreloaderFile in={true} timeout={1000} loader={this.state.loader} statys={this.state.statys}/>
                   {/* {(this.state.statys === 'pending')&&<PreloaderFile loader={this.state.loader} statys={this.state.statys}/>} */}
            </div>
        )
    }
}

const PreloaderFile = ({loader = 0, statys = 'pending'}) => {
    return <div className={'template_preloader fix' + ((statys === 'success')? ' hiden' : '')}>
    <div className="progress">
       <div style={{width: ((statys === 'success')? '100%' : loader - 5 + '%')}} className="progress-bar progress-bar-striped progress-bar-animated"></div>
    </div>
    </div>
    }


// class Animated extends React.Component {
// constructor(){
//     super();
//     this.state = {pr: 'this.props.children'}
//     console.log('1');
// }

// componentWillMount(){
    
// }

//     componentWillReceiveProps(nextProps) {

//         if (this.props.children.props.statys === 'success') console.log('statys: ', 'success');
//         if (this.props.children && !nextProps.children) {
//         }
//       }

// componentDidUpdate(){
//     console.log('2', this.props.children.props);
//     console.log('statys: ', this.props.children.props.statys);
// }

//     render(){
//         return <React.Fragment>
//             {this.props.children}
//             {console.log('3')}
//         </React.Fragment>
//     }
// }

// class PreloaderFile extends React.Component {
// componentWillUnmount(){
//     console.log('componentWillUnmount');
// }    
// render(){   
// return <div className={'template_preloader fix' + ((this.props.statys === 'success')? ' hiden' : '')}>
// <div className="progress">
//    <div style={{width: ((this.props.statys === 'success')? '100%' : this.props.loader - 5 + '%')}} className="progress-bar progress-bar-striped progress-bar-animated"></div>
// </div>
// </div>
// } }



const LogOut = (props) => {
    return <div className="log-out" onClick={props.linkout}>
        <span className="glyphicon glyphicon-log-out"></span>
    </div>
}

const Preloader = (props) => {
    return <div id="floatingCirclesG" className={props.loading}>
        <div className="f_circleG" id="frotateG_01"></div>
        <div className="f_circleG" id="frotateG_02"></div>
        <div className="f_circleG" id="frotateG_03"></div>
        <div className="f_circleG" id="frotateG_04"></div>
        <div className="f_circleG" id="frotateG_05"></div>
        <div className="f_circleG" id="frotateG_06"></div>
        <div className="f_circleG" id="frotateG_07"></div>
        <div className="f_circleG" id="frotateG_08"></div>
    </div>
}

const BreadCrumbs = (props) => {
    return props
        .folder
        .map((item, index) => (item && <span key={item}>
            <a
                href={props
                .folder
                .slice(0, index + 1)
                .join('/')}
                onClick={props.link}>{item}</a>&nbsp;/
        </span>));
}

const BildFileTree = (props) => {
    return props
        .disk
        .map((item) => (
            <tr key={item.name}>
                {item.type === 'dir'
                    ? (
                        <td onClick={() => props.folder(item.name)} colSpan="2">
                            <span className='glyphicon glyphicon-folder-close style-dir'></span>{item.name}</td>
                    )
                    : (
                        <React.Fragment>
                            <td onClick={() => props.file(item.name)}>
                                <span className='glyphicon glyphicon-file style-file'></span>{item.name}</td>
                            <td onClick={() => props.delete(item.name)} className="trash">
                                <span className='glyphicon glyphicon-trash style-file'></span>
                            </td>
                        </React.Fragment>
                    )
}
            </tr>
        ));
}

class Token extends React.Component {
    getTokenPage = event => {
        event.preventDefault();
        document.location = event.target.href;
    }
    render() {
        return (
            <React.Fragment>
                <div className="container">
                    <div className="row">
                        <div className="col-md-12">
                            <h2>Яндекс Диск</h2>
                            <div className="jumbotron">
                                <p>Для&nbsp;доступа к&nbsp;своему разделу на&nbsp;Яндекс.Диск
                                    нажмите&nbsp;кнопку "Получить&nbsp;доступ&nbsp;к&nbsp;диску".<br/>
                                    Затем&nbsp;подтвердите доступ для&nbsp;приложения на&nbsp;странице&nbsp;Яндекс.<br/>
                                    <h5>Ваши учетные данные не передаются в приложение, доступ осуществляется по токену.</h5>
                                </p><br/>
                                <a
                                    className="btn btn-success btn-lg"
                                    href={AUTH_TOKEN}
                                    onClick={this.getTokenPage}>Получить доступ к диску</a>
                            </div>
                        </div>
                    </div>
                </div>
            </React.Fragment>
        )
    }
}

const Button = (props) => {
    return <button className={props.class} onClick={props.onExecute}>{props.children}</button>
}

//  Main
ReactDOM.render(
    <App/>, document.getElementById('root'));

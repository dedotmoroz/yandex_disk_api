import 'core-js/es6/map';
import 'core-js/es6/set';

import React from 'react';
import ReactDOM from 'react-dom';
import './css/bootstrap.css';
import './css/styles.css';

// Yandex REST API (OAuth 2.0)
const CLIENT_ID = "500dea2d0ffe40e6b2c13cc6f1ae72b6";
// const AUTH_TOKEN = "https://oauth.yandex.ru/authorize?response_type=token&client_id=500dea2d0ffe40e6b2c13cc6f1ae72b6&redirect_uri=https://apps-4-you.com/yadisk/";
const AUTH_TOKEN = "http://localhost:3000/#access_token=AQAAAAAAAThbAATatSm06ZDdvEJ2hprKA2KoB5A&token_type=bearer&expires_in=30076128";
// Yandex.Disc API
const API_FOLDERS = "https://cloud-api.yandex.net/v1/disk/resources?path=";
const API_FILES = "https://cloud-api.yandex.net/v1/disk/resources/download?path=";
const API_UPLOAD = "https://cloud-api.yandex.net:443/v1/disk/resources/upload?path=";
const API_DELETE = "https://cloud-api.yandex.net:443/v1/disk/resources?path=";



async function API (requests, init){
    const response = await fetch(requests, init);
    const json = await response.json();
    return json;
}



class App extends React.Component {

state = {token: ""};

componentWillMount(){
    if (document.location.hash){
        const hash_token = /access_token=([^&]+)/.exec(document.location.hash)[1];
        this.setCookie("token", hash_token);
        this.setState({token: hash_token});
        document.location = document.location.origin + document.location.pathname;
        return;
    } 

    const cookie_token = this.getCookie("token");
    if(cookie_token && cookie_token !=='LOGOUT'){
        this.setState({token: cookie_token});
        return;
    }
}

getCookie(name) {
    var matches = document.cookie.match(new RegExp(
      "(?:^|; )" + name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') + "=([^;]*)"
    ));
    return matches ? decodeURIComponent(matches[1]) : undefined;
}

setCookie(name, token){
    var date = new Date();
    date.setDate(date.getDate() + 365);
    const collectCookie = name + "=" + token + "; path=/; expires=" + date;
    document.cookie = collectCookie;  
}

render(){
  return <div>{this.state.token ? <YandexDisk token={this.state.token}/> : <Token/>}</div>
  }
}

class YandexDisk extends React.Component {
    constructor(){
        super();
        this.state = {folder: [], disk: [], loading: "hide", error: ""};
        this.arrayDisk =[];
    }
    
 getFolder(folder_name = ''){
        this.arrayDisk.length = 0;
        this.preloader('show');
        this.setState({error : ""});
        const folder_path = this.state.folder.join('/').replace('disk:/', '') + '/';
        const FOLDER_URL = API_FOLDERS + folder_path + folder_name + "&limit=10000";
        const headers = new Headers({ 'Authorization' : `OAuth ` + this.props.token });
        const init = {headers: headers};  
        fetch(FOLDER_URL, init).then(response => 
          response.json()).then(
              (result) =>{
                  result._embedded.items.map((item, index)=>{this.arrayDisk[index] = item;})
                  const arrayFolders = result._embedded.path.split("/");
                  this.preloader('hide');
                  this.setState({disk: this.arrayDisk, folder: arrayFolders});
                  return true;
              },
              (error) => {
                  console.log(error);
              }
            )
            .catch(error => {
                  this.setState({error : "Ошибка открытия папки"}) 
               }
            );
    }

    getFile(file_name){     
        const folder_path = this.state.folder.join('/').replace('disk:/', '') + '/';
        const FILE_URL = API_FILES + folder_path + file_name;
        const headers = new Headers({ 'Authorization' : `OAuth ` + this.props.token });
        const init = {headers: headers};
        fetch(FILE_URL, init).then(response => 
          response.json()).then(
              (result) =>{
                  window.location = result.href;
                  this.setState({download : result.href})              
              },
              (error) => {
                  console.log(error);
              }
            )
            .catch(error => {
                  this.setState({error : "Ошибка загрузки файла"}) 
               }
            );
    }


    deleteFile(file_name){     
        const folder_path = this.state.folder.join('/').replace('disk:/', '') + '/';
        const FILE_URL = API_DELETE + folder_path + file_name;
        console.log('del', FILE_URL);
        const headers = new Headers({ 
            'Authorization' : `OAuth ` + this.props.token,
        });
        const init = {
            method: 'DELETE',
            headers: headers
        };

        fetch(FILE_URL, init).then(response => {
                  console.log('del', response.status); 
                  if (response.status === 204){
                    console.log(this.state.disk);  
                    const arr = this.state.disk.filter(item => {
                        console.log(item.name);
                        if (item.name !== file_name) return true;
                    })
                    console.log(arr);
                    this.setState({disk: arr});
                    //this.getFolder();
                  }
              }
            )
            .catch(error => {
                  this.setState({error : "Ошибка удаления файла"}) 
               }
            );
    }    


    changeFolders(event){
      event.preventDefault();  
      const arrayFolders = event.target.href.split("/");
      this.setState({folder: arrayFolders}, () => this.getFolder(''));
    }

    preloader(switch_preloader){
        switch (switch_preloader){
          case 'hide' : this.setState({loading:"hide"}); break;
          case 'show' : this.setState({loading:"show"}); break;
        }
    }

    logOut(){
        document.cookie = "token=LOGOUT";  
        document.location = document.location.origin + document.location.pathname;
    }

    componentDidMount(){
        this.setState({folder: ['disk:/']}, () => this.getFolder(''));
    }

render(){
return(
    <React.Fragment>
    <div className="container">
    <div className="row">
    <div className="col-md-12">
    <Preloader loading={this.state.loading}/>
    <h2>Яндекс Диск</h2>
    <LogOut linkout={this.logOut.bind(this)}/>
    <h3><span className='glyphicon glyphicon-folder-open current-dir'></span>
    <BreadCrumbs folder ={this.state.folder} link={this.changeFolders.bind(this)}/>
    </h3>
    <FileUpload folder={this.state.folder} token={this.props.token}/>
    <table className="table table-bordered table-striped table-hover"><tbody>
    <BildFileTree disk={this.state.disk} folder={this.getFolder.bind(this)} file={this.getFile.bind(this)} delete={this.deleteFile.bind(this)}/>   
    </tbody></table> 
    <h3>{this.state.error}</h3>
    </div>
    </div>
    </div>
    </React.Fragment>
        )
    }
}

class FileUpload extends React.Component{
static defaultProps = {
    token: 'token', 
    folder: ['disk:','Temp']
}

state = {buttonLabel: 'Выберите файлы для загрузки', buttonClass: 'hidden'}

getUploadLink(event) {
        event.preventDefault();
        const file_on_local_disk = this.fileInput.files[0];
        const file_name = this.fileInput.files[0].name;
        const file_path = this.props.folder.reduce((previousValue, currentItem) => currentItem && (previousValue + '/' + currentItem)) + '/';
        const FOLDER_URL = API_UPLOAD + file_path + file_name +'&overwrite=true';
        const headers = new Headers({
            'Authorization' : 'OAuth ' + this.props.token,
            'Content-Type' : 'application/json'
        });

        const init = {
            method: 'GET',
            headers: headers
        };

        const formData = new FormData();
        formData.append('file', file_on_local_disk);

        var myInit = {
            method: 'PUT',
            body: formData
        };

        async function uploadFile(){
            const response =  await fetch(FOLDER_URL, init);
            const json = await response.json();
            const dispatch = await fetch(json.href, myInit);
            console.info(dispatch.console);
        }

        uploadFile();
    }


fileInputChange(event){
    const buttonText = (event.target.files.length > 0) ? `Файл: ${event.target.files[0].name}` : `Выберите файл для загрузки`;
    this.setState({buttonLabel: buttonText, buttonClass : ''});
}

render(){
return(<div>
<form id="sentfile" name="uploadfile" onSubmit={this.getUploadLink.bind(this)}>
<label htmlFor="fileinput" className="btn btn-link text-uppercase">{this.state.buttonLabel}</label>
<input name="file" type="file" ref={input => {this.fileInput = input;}}  id="fileinput" className="hidden" multiple="multiple" onChange={this.fileInputChange.bind(this)} />
<Button  class={'btn btn-primary text-uppercase ' + this.state.buttonClass}>ЗАГРУЗИТЬ</Button>
</form>
</div>)
}
}

const LogOut = (props) => {
    return <div className="log-out" onClick={props.linkout}><span className="glyphicon glyphicon-log-out"></span></div>
}

const Preloader = (props) =>{
    return <div id="floatingCirclesG" className={props.loading}>
	<div className="f_circleG" id="frotateG_01"></div><div className="f_circleG" id="frotateG_02"></div><div className="f_circleG" id="frotateG_03"></div><div className="f_circleG" id="frotateG_04"></div><div className="f_circleG" id="frotateG_05"></div><div className="f_circleG" id="frotateG_06"></div><div className="f_circleG" id="frotateG_07"></div><div className="f_circleG" id="frotateG_08"></div>
    </div>
}

const BreadCrumbs = (props) =>{
    return props.folder.map((item, index) => (
        item && <span key={item}><a href={props.folder.slice(0, index + 1).join('/')} onClick={props.link}>{item}</a>&nbsp;/ </span>
)); 
}

const BildFileTree = (props) =>{
    return props.disk.map((item)=> (
        <tr key={item.name}>
             {item.type === 'dir' ?
                (<td onClick={()=>props.folder(item.name)} colSpan="2"><span className='glyphicon glyphicon-folder-close style-dir'></span>{item.name}</td>)
                :
                (
                <React.Fragment>
                <td onClick={()=>props.file(item.name)}><span className='glyphicon glyphicon-file style-file'></span>{item.name}</td>
                <td onClick={()=>props.delete(item.name)} className="trash"><span className='glyphicon glyphicon-trash style-file'></span></td>
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
    render(){
        return(
            <React.Fragment>
            <div className="container">
              <div className="row"><div className="col-md-12">
              <h2>Яндекс Диск</h2>
              <div className="jumbotron">
              <p>Для&nbsp;доступа к&nbsp;своему разделу на&nbsp;Яндекс.Диск нажмите&nbsp;кнопку "Получить&nbsp;доступ&nbsp;к&nbsp;диску".<br/>
              Затем&nbsp;подтвердите доступ для&nbsp;приложения на&nbsp;странице&nbsp;Яндекс.<br/>
              <h5>Ваши учетные данные не передаются в приложение, доступ осуществляется по токену.</h5>
              </p><br/>
              <a className="btn btn-success btn-lg" href={AUTH_TOKEN} onClick={this.getTokenPage}>Получить доступ к диску</a>
              </div>
              </div></div>
            </div>
            </React.Fragment>
        )
    }
}



const Button = (props) =>{
return <button className={props.class} onClick={props.onExecute}>{props.children}</button>
}

//  Main
ReactDOM.render( 
    <App/> ,
    document.getElementById('root')
);

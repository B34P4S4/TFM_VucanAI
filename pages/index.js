//NEXT
import Head from "next/head";
import { useState, useEffect, useRef } from "react";

//PRIMEREACT
import { PrimeReactProvider, PrimeReactContext } from 'primereact/api';
import 'primeicons/primeicons.css';

import jsPDF from 'jspdf';
import { Skeleton } from 'primereact/skeleton';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { TabView, TabPanel } from 'primereact/tabview';
import { Terminal } from 'primereact/terminal';
import { ToggleButton } from 'primereact/togglebutton';
import { Rating } from 'primereact/rating';
import { Panel } from 'primereact/panel';
//CSS
import 'primereact/resources/themes/soho-light/theme.css';
import styles from "./index.module.css";


export default function Home() {
  //ES true, EN false
  const [lang, setLanguage] = useState(true);
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState([
    { role: "system", content: "You are a helpful assistant." },
  ]);
  var infoPDF = new Array();
  
  const sendMessage = async (message) => {
    // Append user message to chat history
    setChatHistory((prev) => [...prev, { role: "user", content: message }]);

    // Send the user's message to the server
    const response = await fetch("/api/generate?endpoint=chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message }),
    });

    const data = await response.json();
    var endOfMessage = 0;

    if (data.success) {

      // Open a connection to receive streamed responses
      const eventSource = new EventSource("/api/generate?endpoint=stream");
      eventSource.onmessage = function (event) {
        // Parse the event data, which is a JSON string
        const parsedData = JSON.parse(event.data);

        //console.log("bea tokens: "+parsedData);       
        if(parsedData==""){ endOfMessage++;}
      

        // Check if the last message in the chat history is from the assistant
        setChatHistory((prevChatHistory) => {
          const newChatHistory = [...prevChatHistory];
          if (
            newChatHistory.length > 0 &&
            newChatHistory[newChatHistory.length - 1].role === "assistant"
          ) {
            // If so, append the new chunk to the existing assistant message content
            newChatHistory[newChatHistory.length - 1].content += parsedData;
            
            //AÑADIMOS SOLO LOS ELEMENTOS DEL JSON
            processMessage(parsedData);
            
          } else {
            // Otherwise, add a new assistant message to the chat history            
            newChatHistory.push({ role: "assistant", content: parsedData });
          }

          return newChatHistory;
        });           

      };

      eventSource.onerror = function () {
        eventSource.close();
      };

      
      //MOSTRAMOS PROCESANDO
      setPhase(1);
      console.log("Pasando a fase 1 - Procesando");
      setTimeout(parseJSON, 12000);
    }
  };

  const clearChat = async () => {

    setMessage("");

    // Clear the chat history in the client state
    setChatHistory([
      { role: "system", content: "You are a helpful assistant." },
    ]);

    // Reset the chat history on the server
    await fetch("/api/generate?endpoint=reset", { method: "POST" });
  };

  const onSubmit = (event) => {
    event.preventDefault();
    if (!message.trim()) return;

    var msg = message.replaceAll(/(\r\n|\n|\r)/gm, "");

    var codev = [];
    if(msg.toString().includes("; "))
    {
      codev = msg.split(";");
    }

    //PROMPT SEGUN IDIOMA
    //ESPAÑOL
    var initMessageES = "Necesito que respondas en formato JSON de la forma 'Numero de pregunta': 'Respuesta' siguiendo el orden propuesto a continuación: "+
    "1.1.¿Es vulnerable? Solo sí o no."+
    "1.2.Nombre de la vulnerabilidad."+
    "1.3.Explica brevemente en qué consiste esta vulnerabilidad."+
    //"1.4.Dame el número de la línea en que se produce la entrada de código malicioso del 1 al "+codev.length+"."+
    //"1.5.Dame el número de la línea en que se ejecuta la vulnerabilidad del 1 al "+codev.length+"."+
    "1.4.Dime la línea en que se produce la entrada de código malicioso."+
    "1.5.Dime la línea en que se ejecuta la vulnerabilidad."+
    "2.1.Nivel de Common Vulnerability Score System del 1 al 4, siendo 4 el más grave. En formato número."+
    "2.2.Nivel de impacto del riesgo del 1 al 5, siendo 5 el de mayor impacto. En formato número."+
    "2.3.Nivel de probabilidad del riesgo del 1 al 5, siendo 5 el más probable. En formato número."+
    "3.1.Del 1 al 10, posicion en el ranking TOP 10 de OWASP de 2021 de esta vulnerabilidad. En formato número."+
    "3.2.Código CAPEC de la vulnerabilidad. En formato número."+
    "3.3.Código CWE de la vulnerabilidad. En formato número."+
    "3.4.Códigos de todas las técnicas de MITRE ATT&CK relacionadas con ese CWE. Solo los códigos."+
    "3.5.Por cada técnica dame las tácticas de MITRE ATT&CK correspondientes. Cada elemento de la lista proporcionada debe ser una cadena de texto con esta forma: Codigo de la Técnica espacio Nombre de la Técnica : Código de la táctica y Nombre de la táctica."+
    "4.1.Dame el código corregido, sin vulnerabilidad."+
    "4.2.Explica qué y cómo se corrige o mitiga. "+
    "5.1.Lista de pruebas de pentesting para comprobar que se ha corregido. "+
    "5.2.Lista de herramientas para comprobar que se ha corregido. "+
    "Sobre el codigo: ";
    //INGLES
    var initMessageEN = "I need you to answer in JSON format in the form 'Question number': 'Answer' following the order proposed below: "+
    "1.1.Are you vulnerable? Only yes or no."+
    "1.2.Name of the vulnerability."+
    "1.3.Explain briefly what this vulnerability consists of."+
    "1.4.From 1 to "+codev.length+", line number in which the entry of malicious code takes place. In number format."+
    "1.5.From 1 to "+codev.length+", line number in which the vulnerability is executed.  In number format."+
    "2.1.Common Vulnerability Score System level from 1 to 4, with 4 being the most severe."+
    "2.2.Impact level of the risk from 1 to 5, with 5 being the highest impact."+
    "2.3.Probability level of the risk from 1 to 5, with 5 being the most probable."+
    "3.1.From 1 to 10 position in the ranking TOP 10 of OWASP of 2021 of this vulnerability."+
    "3.2.CAPEC code. In number format."+
    "3.3.CWE code. In number format."+
    "3.4.Codes of all techniques of MITRE ATT&CK related to that CWE. Only the codes."+
    "3.5.From each technique provided, the related MITRE ATT&CK tactics. Each item in the list provided should be a text string in this form: Numeric code of the Tactic space Name of the Tactic : Code of the technique(s)."+
    "4.1.Give me the corrected code so that it is no longer vulnerable."+
    "4.2.Explain what and how to fix or mitigate it."+
    "5.1.Pentesting tests list to check that it has been fixed."+
    "5.2.Tools list to check that it has been fixed."+
    "About the code: "; 
    
    //DEPENDIENDO DEL LENGUAJE
    if(lang==true)
    { 
      sendMessage((initMessageES+msg).trim());
    }else{
      sendMessage((initMessageEN+msg).trim());
    }

  };

  const showError = async (e) => {
    setPhase(2);
    console.log("pasando a fase 2 - Error");
    console.log("error:"+e);
  }

  const init = async () => {
    clearChat();
    setPhase(0);
    console.log("pasando a fase 0 - Instrucciones e input");
  };


////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//TRATAMIENTO DE RESPUESTA IA Y JSON
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  var respuestaGPT = "";
  const [objJson, setObj] = useState(null);
  
  //PROCESANDO RESPUESTA
  const processMessage = (pData) => {
    respuestaGPT += pData;
  };

  //PARSEO JSON
  const parseJSON = () => {    
    try{
        var objetoJson = JSON.parse(respuestaGPT);
        console.log(objetoJson);  
        //PROCESAMOS SU INFORMACION PARA MOSTRAR EL DASHBOARD ACORDE
        processJson(objetoJson);               
    }catch(err){
        showError(err);
    }
  };

  const [npdfcopy, setnpdfcopy] = useState(0);

  //GENERAR INFORME
  const exportPdf = () => {
    //VAR PDF
    var doc = new jsPDF();
    var pdfname = "Informe_Analisis_IA_";
    var ttintro = "Tácticas y técnicas de MITRE ATT&CK:";
    var sol = "Sugerencia de solución";
    var pen = "Pruebas de pentesting";
    var her = "Herramientas de testeo";
    var ass = "Evaluación del riesgo";
    if(lang==false){
      pdfname = "IA_Analyzer_Report_";
      ttintro = "Tactics and techniques MITRE ATT&CK:";
      sol = "Suggested solution:";
      pen = "Pentesting";
      her = "Testing tools";
      ass = "Risk Assessment";
    } 
    var i= 0;

    //VAR DATE
    var hoy = new Date();
    var mes = hoy.getMonth().toString();
    var dia = hoy.getDate().toString();
    var an = hoy.getFullYear().toString();
    var h = hoy.getHours().toString();
    var m = hoy.getMinutes().toString();
    var s = hoy.getSeconds().toString();
    
    if(dia.length<2)dia="0"+dia;
    if(mes.length<2)mes="0"+mes;
    if(h.length<2)h="0"+h;
    if(m.length<2)m="0"+m;
    if(s.length<2)s="0"+s;

    var fechapdf = dia+"/"+mes+"/"+an+" "+h+":"+m+":"+s;
    var fechafile = dia+"-"+mes+"-"+an;

    if(lang==false)
    {
      fechapdf = mes+"/"+dia+"/"+an+" "+h+":"+m+":"+s;
      fechafile = mes+"-"+dia+"-"+an;
    }
    console.log(fechapdf+"   "+fechafile);
    
    //VARS FORMATO 
    var marginTop = 20;
    var marginLeft = 20;
    var marginTab = 30;
    var saltoLinea10 = 10;
    var saltoLinea5 = 5;
    var nlinea = 1;
    var sizeTitle = 20;
    var sizeSubtitle = 15;
    var sizeTxt = 10;
   
    //FECHA REPORT
    doc.setFont("helvetica","italic");
    doc.setFontSize(sizeTxt);
    doc.text(marginLeft+150, 10, fechapdf);
    
    //TITULO ///////////////////////////////////////////////////////////////////////
    doc.setFont("helvetica","bold");
    doc.setFontSize(sizeTitle);
    doc.text(marginLeft, marginTop, pdfname.replaceAll("_"," "));
        
    //PANEL0 ///////////////////////////////////////////////////////////////////////
    doc.setFontSize(sizeSubtitle);
    doc.text(marginLeft, marginTop + saltoLinea10, infoPDF[0]["titulo"].toString());    
    marginTop = marginTop + saltoLinea10;
    
    doc.setFont("helvetica","italic");
    doc.text(marginLeft, marginTop + saltoLinea10, infoPDF[0]["nameV"].toString());
    marginTop = marginTop + saltoLinea10;
    doc.setFont("helvetica","normal");
    doc.setFontSize(sizeTxt);
    doc.text(marginLeft, marginTop + saltoLinea5, infoPDF[0]["descripV"].toString(),{
        maxWidth: 150,
        align: 'left'
    });
    marginTop = marginTop + saltoLinea10 + saltoLinea5;

    //PANEL1 /////////////////////////////////////////////////////////////////////////
    doc.text(marginLeft, marginTop + saltoLinea5, infoPDF[1]["introlines"].toString(),{
        maxWidth: 150,
        align: 'left'
    });
    marginTop = marginTop + saltoLinea5;
    doc.text(marginTab, marginTop + saltoLinea5, infoPDF[1]["source"].toString(),{
        maxWidth: 150,
        align: 'left'
    });
    marginTop = marginTop + saltoLinea5;
    doc.text(marginTab, marginTop + saltoLinea5, infoPDF[1]["sink"].toString(),{
        maxWidth: 150,
        align: 'left'
    });
    marginTop = marginTop + saltoLinea10;

    //PANEL3 /////////////////////////////////////////////////////////////////////////
    doc.text(marginLeft, marginTop + saltoLinea5, infoPDF[2]["top"].toString(),{
        maxWidth: 150,
        align: 'left'
    });
    marginTop = marginTop + saltoLinea5;
    doc.text(marginLeft, marginTop + saltoLinea5, infoPDF[2]["capec"].toString(),{
        maxWidth: 150,
        align: 'left'
    });
    marginTop = marginTop + saltoLinea5;
    doc.text(marginLeft, marginTop + saltoLinea5, infoPDF[2]["cwe"].toString(),{
        maxWidth: 150,
        align: 'left'
    });
    marginTop = marginTop + saltoLinea5;
    doc.text(marginLeft, marginTop + saltoLinea5, ttintro);
    marginTop = marginTop + saltoLinea5;
    for(let j=0;j<infoPDF[3]["tt"].length;j++)
    {
      doc.text(marginTab, marginTop + saltoLinea5, "· "+infoPDF[3]["tt"][j].toString(),{
        maxWidth: 150,
        align: 'left'
      });
      marginTop = marginTop + saltoLinea5;
    }
    marginTop = marginTop + saltoLinea5;

    //PANEL4 /////////////////////////////////////////////////////////////////////////
    doc.setFont("helvetica","bold");
    doc.text(marginLeft, marginTop + saltoLinea5, sol,{
        maxWidth: 150,
        align: 'left'
    });
    marginTop = marginTop + saltoLinea5;
    doc.setFont("helvetica","normal");
    doc.text(marginLeft, marginTop + saltoLinea5, infoPDF[4]["explanation"].toString(),{
        maxWidth: 150,
        align: 'left'
    });
    if(infoPDF[4]["explanation"].toString().length>70){
      marginTop = marginTop + (saltoLinea5*(infoPDF[4]["explanation"].toString().length/70));
    }else{ marginTop = marginTop + saltoLinea5;}
    doc.setFont("courier","normal");
    for(let j=0;j<infoPDF[4]["correct"].length;j++)
    {
      doc.text(marginLeft, marginTop + saltoLinea5, infoPDF[4]["correct"][j].toString().trim(),{
        maxWidth: 150,
        align: 'left'
      });
      if(infoPDF[4]["correct"][j].toString().length<=69)marginTop = marginTop + saltoLinea5;
      else marginTop = marginTop + saltoLinea10;
    }
    doc.setFont("helvetica","bold");
    doc.text(marginLeft, marginTop + saltoLinea5, pen,{
        maxWidth: 150,
        align: 'left'
    });
    marginTop = marginTop + saltoLinea5;
    doc.setFont("helvetica","normal");
    for(let j=0;j<infoPDF[5]["pentesting"].length;j++)
    {
      doc.text(marginTab, marginTop + saltoLinea5, "· "+infoPDF[5]["pentesting"][j].toString(),{
        maxWidth: 150,
        align: 'left'
      });
      
      if(infoPDF[5]["pentesting"][j].toString().length<=70)marginTop = marginTop + saltoLinea5;
      else marginTop = marginTop + (saltoLinea5*(infoPDF[5]["pentesting"][j].toString().length/70));
    }
    marginTop = marginTop + saltoLinea5;
    doc.setFont("helvetica","bold");
    doc.text(marginLeft, marginTop + saltoLinea5, her,{
        maxWidth: 150,
        align: 'left'
    });
    marginTop = marginTop + saltoLinea5;
    doc.setFont("helvetica","normal");
    for(let j=0;j<infoPDF[6]["tools"].length;j++)
    {
      doc.text(marginTab, marginTop + saltoLinea5, "· "+infoPDF[6]["tools"][j].toString(),{
        maxWidth: 150,
        align: 'left'
      });
      marginTop = marginTop + saltoLinea5;
    }  
    marginTop = marginTop + saltoLinea5;

    //PANEL 2 ///////////////////////////////////////////////////////////////////////////
    doc.setFont("helvetica","bold");
    doc.text(marginLeft, marginTop + saltoLinea5, "CVSS");
    marginTop = marginTop + saltoLinea5; 
    doc.setFont("helvetica","normal"); 
    doc.text(marginTab, marginTop + saltoLinea5, "· "+infoPDF[7]["gravity"].toString()+" -> "+infoPDF[7]["rate"].toString(),{
      maxWidth: 150,
      align: 'left'
    });
    marginTop = marginTop + saltoLinea10;
    doc.setFont("helvetica","bold");
    doc.text(marginLeft, marginTop + saltoLinea5, ass);
    marginTop = marginTop + saltoLinea5; 
    doc.setFont("helvetica","normal"); 
    doc.text(marginTab, marginTop + saltoLinea5, "· "+infoPDF[8]["impact"].toString()+" -> "+infoPDF[8]["rateimp"].toString(),{
      maxWidth: 150,
      align: 'left'
    });
    marginTop = marginTop + saltoLinea5; 
    doc.text(marginTab, marginTop + saltoLinea5, "· "+infoPDF[8]["probability"].toString()+" -> "+infoPDF[8]["rateprob"].toString(),{
      maxWidth: 150,
      align: 'left'
    });
    marginTop = marginTop + saltoLinea5; 
    doc.text(marginTab, marginTop + saltoLinea5, "· "+infoPDF[8]["risk"].toString()+" -> "+infoPDF[8]["raterisk"].toString(),{
      maxWidth: 150,
      align: 'left'
    });

    //SAVE PDF
    if(npdfcopy==0){
      doc.save(pdfname+fechafile+'.pdf');
    }else{
      doc.save(pdfname+fechafile+'_('+npdfcopy+').pdf');
    }
    setnpdfcopy(npdfcopy+1); 
  }; 

  //ES EL CODIGO VULNERABLE
  const isVulnerable = (o) =>{
    if(o=="Sí"||o=="Yes"||o=="sí"||o=="yes")
    {
      return true;
    }else{
      return false;
    }
  };

  //PROCESANDO OBJETO JSON
  const processJson = (obj) => {

    var isVul= isVulnerable(obj["1.1"]);
    
    //COLOCAMOS JSON EN UN OBJETO
    setObj(obj);

    if(isVul)
    {
      buildDashboard(obj);
    }else{
      console.log(">>> El codigo NO es vulnerable >> Pasando a fase 4");
      setPhase(4);
    }

  };

  
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//CONSTRUIMOS EL DASHBOARD
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  const buildDashboard = (obj) => {

    //MOSTRAMOS EL DASHBOARD
    setPhase(3);
  };

  const getObjJson = (id) => {
    return objJson[id];
  };

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//BLOQUE 1 DEL DASHBOARD
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  var nameV = "";
  var descripV = "";

  var VulDetectedTxt = "Detectada vulnerabilidad ";
  var SaveButtonTxt = "Guardar";
  var BackButtonTxt = "Volver";
  if(lang==false)
  {
    VulDetectedTxt = "Vulnerability detected ";
    SaveButtonTxt = "Save";
    BackButtonTxt = "Back";
  }

  const createVulCard = () => {

    const footer = (
      <>
        <Button label={SaveButtonTxt} icon="pi pi-save" style={{marginLeft: '43%'}} onClick={exportPdf}/>
        <Button label={BackButtonTxt} severity="secondary" icon="pi pi-undo" style={{ marginLeft: '0.5em' }} onClick={init}/>
      </>
    );

    nameV = getObjJson("1.2");
    descripV = getObjJson("1.3");

    //////////////////////////////////////////////////////////////////////////////
    // AÑADIMOS NIVEL DE RIESGO EN EL ENCABEZADO /////////////////////////////////
    //////////////////////////////////////////////////////////////////////////////

    var ratingRiskTxt = ["Muy Bajo","Bajo","Medio","Alto","Muy Alto","Extremo"];
    var lriskTxt = "de riesgo: ";
    if(lang==false){
      ratingRiskTxt = ["Very Low","Low","Medium","High","Very High","Extreme"];
      lriskTxt = "- Risk level: ";
    }

    var iconRisk;
    var imp = getObjJson("2.2");
    var prob = getObjJson("2.3");
    var rsk = 0;
    if(isNumber(imp)&&isNumber(prob))rsk = imp * prob;  

    //RISK
    if(isNumber(rsk))
    {
      if(parseInt(rsk)<3)
      {
        //MUY BAJO 
        VulDetectedTxt = VulDetectedTxt + lriskTxt + ratingRiskTxt[0];
        iconRisk = <i className="pi pi-exclamation-triangle" style={{ fontSize: '10rem', color:'#61CD42', marginLeft:'45.5%'}}></i>;
      }else{
        if(parseInt(rsk)<5)
        {
          //BAJO 
          VulDetectedTxt = VulDetectedTxt + lriskTxt + ratingRiskTxt[1];
          iconRisk = <i className="pi pi-exclamation-triangle" style={{ fontSize: '10rem', color:'#228505', marginLeft:'45.5%'}}></i>;
        }else{
          if(parseInt(rsk)<10)
          {
            //MEDIO 
            VulDetectedTxt = VulDetectedTxt + lriskTxt + ratingRiskTxt[2];
            iconRisk = <i className="pi pi-exclamation-triangle" style={{ fontSize: '10rem', color:'#F5F508', marginLeft:'45.5%'}}></i>;
          }else{
            if(parseInt(rsk)<15)
            {
              //ALTO 
              VulDetectedTxt = VulDetectedTxt + lriskTxt + ratingRiskTxt[3];
              iconRisk = <i className="pi pi-exclamation-triangle" style={{ fontSize: '10rem', color:'#F5A206', marginLeft:'45.5%'}}></i>;
            }else{
              if(parseInt(rsk)<20)
              {
                //MUY ALTO 
                VulDetectedTxt = VulDetectedTxt + lriskTxt + ratingRiskTxt[4];
                iconRisk = <i className="pi pi-exclamation-triangle" style={{ fontSize: '10rem', color:'#F51106', marginLeft:'45.5%'}}></i>;
              }else{
                //EXTREMO 
                VulDetectedTxt = VulDetectedTxt + lriskTxt + ratingRiskTxt[5];
                iconRisk = <i className="pi pi-exclamation-triangle" style={{ fontSize: '10rem', color:'#8B0C05', marginLeft:'45.5%'}}></i>;
              } 
            } 
          }          
        }
      }
    }else{
      iconRisk = <i className="pi pi-exclamation-triangle" style={{ fontSize: '10rem', color:'#8B0C05'}}></i>;
    }

    //PDF//
    infoPDF.push({"titulo":VulDetectedTxt,"nameV":nameV,"descripV":descripV});
    console.log("GUARDANDO PDF >>>>> titulo");
    //

    return (
      <Card title={VulDetectedTxt} subTitle={nameV} footer={footer} header={iconRisk} className="md:w-25rem" style={{ width: '100%'}}>
        <p className="m-0">{descripV}</p>
      </Card>
    );
  };
  
  var lineSource = 0;
  var lineSink = 0;

  const isNumber = (value) => {
    //console.log(!isNaN(value)+" isNumber:"+value);
    return !isNaN(value);
  };
  
  const getCode = (l) => {
    //LIMPIAMOS LA ENTRADA Y LA DIVIDIMOS EN LINEAS DE CODIGO
    var code = [];
    /*if(message.toString().includes(";"))
    {
      code = message.split(";");
    }
    
    for(let i = 0; i < code.length; i++) 
    {
      if(code[i].length>1)
      {
        if((i+1)==code.length)
          {
            code[i]= code[i].toString().replace(";", "");
            console.log("REEMPLAZADO"+code[i]);
          }
        if(isNumber(l)&&((i+1)==parseInt(l)))
        {
          code[i] = "["+(i+1)+"] --> "+code[i];
        }else{
          code[i] = "["+(i+1)+"]  "+code[i];
        }
      }
    }*/

    const list = code.map((item,i) => <div key={i}>{item}</div>)
    return list;
  }; 

  const createPanel1 = () => {

    lineSource = getObjJson("1.4");
    lineSink = getObjJson("1.5");
    
    var introTxt = "El código muestra vulnerabilidad "+nameV+", con";
    var VulTxt = "Vulnerabilidad: ";
    var LinSourceTxt = "Línea de origen (Source)";
    var LinSinkTxt = "Línea de ejecución (Sink)";
    if(lang==false){
      VulTxt = "Vulnerability: ";
      introTxt = "Found vulnerability "+nameV+", which has ";
      LinSourceTxt ="Source Line: ";
      LinSinkTxt = "Sink Line: ";
    } 

    //PDF//
    infoPDF.push({"introlines":introTxt+":","source":"· "+LinSourceTxt+": "+lineSource,"sink":"· "+LinSinkTxt+": "+lineSink});
    //

  return (
    <TabView>
      <TabPanel header={VulTxt+nameV}>
          <p className="m-0">
              {descripV}
          </p>
      </TabPanel>
      <TabPanel header={LinSourceTxt}>
          <div className={styles.terminal}>
              <div><p>{"$"+introTxt+" "+LinSourceTxt.toLowerCase()+": "+lineSource}<br/></p></div>
              <div>{getCode(lineSource)}</div>
          </div>
      </TabPanel>
      <TabPanel header={LinSinkTxt}>
          <div className={styles.terminal}>
              <div><p>{"$"+introTxt+" "+LinSinkTxt.toLowerCase()+": "+lineSink}<br/></p></div>
              <div>{getCode(lineSink)}</div>
          </div>
      </TabPanel>
    </TabView>
    );

  };     

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//BLOQUE 2 DEL DASHBOARD
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  var gravity = 0;
  var impact = 0;
  var probab = 0;

  const createPanel2 = () => {  
    return(
    <div>
      <div id="grav_panel">   
        {createGravity()}
      </div>
      <div id="risk_panel">
        {createRisk()}
      </div>
    </div>
    );
  };

  const createGravityRating = () => { 

    gravity = getObjJson("2.1");
    var icon;
    var msgGravity;
    var TxtGravity = "Nivel: "+gravity;
    var ratingTxt = ["Ninguno","Bajo","Medio","Alto","Crítico"];
    if(lang==false){
      TxtGravity = "Score: "+gravity;
      ratingTxt = ["None","Low","Medium","High","Critical"];
    } 

    if(isNumber(gravity))
    {
      switch(gravity.toString())
      {
        case "1":
          icon = <i className="pi pi-exclamation-triangle" style={{ fontSize: '1.5rem', color:'#FA9522', padding: '0.25rem'  }}></i>;
          msgGravity = <div style={{ fontSize: '1.5rem', background:'#FA9522' ,color:'white'}}><p className={styles.msgGravityP}>{ratingTxt[1]}</p></div>;
        break;
        case "2":
          icon = <i className="pi pi-exclamation-triangle" style={{ fontSize: '1.5rem', color:'#FF7733', padding: '0.25rem'  }}></i>;
          msgGravity = <div style={{ fontSize: '1.5rem', background:'#FF7733' ,color:'white'}}><p className={styles.msgGravityP}>{ratingTxt[2]}</p></div>;
        break;
        case "3":
          icon = <i className="pi pi-exclamation-triangle" style={{ fontSize: '1.5rem', color:'#FF5733', padding: '0.25rem' }}></i>;
          msgGravity = <div style={{ fontSize: '1.5rem', background:'#FF5733' ,color:'white'}}><p className={styles.msgGravityP}>{ratingTxt[3]}</p></div>;
        break;
        case "4":
          icon = <i className="pi pi-exclamation-triangle" style={{ fontSize: '1.5rem', color:'#A00007', padding: '0.25rem'  }}></i>;
          msgGravity = <div style={{ fontSize: '1.5rem', background:'#A00007' ,color:'white'}}><p className={styles.msgGravityP}>{ratingTxt[4]}</p></div>;
        break;
        default:
          icon = <i className="pi pi-exclamation-triangle" style={{ fontSize: '1.5rem', color:'green', padding: '0.25rem'  }}></i>;
          msgGravity = <div style={{ fontSize: '1.5rem', background:'#FA9522' ,color:'white'}}><p className={styles.msgGravityP}>{ratingTxt[0]}</p></div>;
        break;
      }

    }else{
      gravity = 0;
      icon = <i className="pi pi-exclamation-triangle" style={{ fontSize: '1.5rem', color:'green', padding: '0.25rem'  }}></i>;
      msgGravity = <div style={{ fontSize: '1.5rem', background:'#FA9522' ,color:'white'}}><p className={styles.msgGravityP}>{ratingTxt[0]}</p></div>;
    }

    //PDF//
    infoPDF.push({"gravity":TxtGravity,"rate":ratingTxt[parseInt(gravity)]});
    //console.log(">>>>>>"+ratingTxt[parseInt(gravity)]);
    //

    return(
      <div>
      {TxtGravity}<Rating value={gravity} readOnly cancel={false} stars={4}
        onIcon={icon}
        offIcon={<i className="pi pi-exclamation-triangle" style={{ fontSize: '1.5rem', color:'lightgrey', padding: '0.25rem' }}></i>}
      />{msgGravity}
      </div>
    );
  };

  const createGravity = () => {
    var legendaGravity ="Sistema de puntuación que clasifica la criticidad de las vulnerabilidades.";
    if(lang==false)legendaGravity="Scoring system that classifies the criticality of vulnerabilities.";    
    return(
      <div className={styles.panelBordeG}>      
        <h2>CVSS (Common Vulnerability Score System)</h2>
        <p>{legendaGravity}</p>
        {createGravityRating()}    
      </div>
    );
  };

  const createRiskRatings = () => {

    impact = getObjJson("2.2");
    probab = getObjJson("2.3");

    var icon_imp;
    var msgImpact;

    var icon_prob;
    var msgProb;

    var icon_risk;
    var msgRisk;

    var ratingImpTxt = ["Insignificante","Menor","Significativo","Mayor","Severo"];
    var ratingProbTxt = ["Raro","Poco Probable","Moderado","Probable","Casi Seguro"];
    var ratingRiskTxt = ["Muy Bajo","Bajo","Medio","Alto","Muy Alto","Extremo"];
    if(lang==false){
      ratingImpTxt = ["Insignificant","Low","Significant","Major","Severe"];
      ratingProbTxt = ["Rare","Unlikely","Moderate","Likely","Almost Certain"];
      ratingRiskTxt = ["Very Low","Low","Medium","High","Very High","Extreme"];
    } 

    //IMPACT
    if(isNumber(impact))
    {
      switch(impact.toString())
      {
        case "1":
          icon_imp = <i className="pi pi-exclamation-triangle" style={{ fontSize: '1.5rem', color:'#FA9522', padding: '0.25rem'  }}></i>;
          msgImpact = <div style={{ fontSize: '1.5rem', background:'#FA9522' ,color:'white'}}><p className={styles.msgGravityP}>{ratingImpTxt[0]}</p></div>;
        break;
        case "2":
          icon_imp = <i className="pi pi-exclamation-triangle" style={{ fontSize: '1.5rem', color:'#FF7733', padding: '0.25rem'  }}></i>;
          msgImpact = <div style={{ fontSize: '1.5rem', background:'#FF7733' ,color:'white'}}><p className={styles.msgGravityP}>{ratingImpTxt[1]}</p></div>;
        break;
        case "3":
          icon_imp = <i className="pi pi-exclamation-triangle" style={{ fontSize: '1.5rem', color:'#FF5733', padding: '0.25rem' }}></i>;
          msgImpact = <div style={{ fontSize: '1.5rem', background:'#FF5733' ,color:'white'}}><p className={styles.msgGravityP}>{ratingImpTxt[2]}</p></div>;
        break;
        case "4":
          icon_imp = <i className="pi pi-exclamation-triangle" style={{ fontSize: '1.5rem', color:'#A00007', padding: '0.25rem'  }}></i>;
          msgImpact = <div style={{ fontSize: '1.5rem', background:'#A00007' ,color:'white'}}><p className={styles.msgGravityP}>{ratingImpTxt[3]}</p></div>;
        break;
        case "5":
          icon_imp = <i className="pi pi-exclamation-triangle" style={{ fontSize: '1.5rem', color:'#A00007', padding: '0.25rem'  }}></i>;
          msgImpact = <div style={{ fontSize: '1.5rem', background:'#A00007' ,color:'white'}}><p className={styles.msgGravityP}>{ratingImpTxt[4]}</p></div>;
        break;
        default:
          icon_imp = <i className="pi pi-exclamation-triangle" style={{ fontSize: '1.5rem', color:'green', padding: '0.25rem'  }}></i>;
          msgImpact = <div style={{ fontSize: '1.5rem', background:'#FA9522' ,color:'white'}}><p className={styles.msgGravityP}>{ratingImpTxt[0]}</p></div>;
        break;
      }

    }else{
      impact = 0;
      icon_imp = <i className="pi pi-exclamation-triangle" style={{ fontSize: '1.5rem', color:'green', padding: '0.25rem'  }}></i>;
      msgImpact = <div style={{ fontSize: '1.5rem', background:'#FA9522' ,color:'white'}}><p className={styles.msgGravityP}>{ratingImpTxt[0]}</p></div>;
    }

    //PROBABILIY
    if(isNumber(probab))
    {
      switch(probab.toString())
      {
        case "1":
          icon_prob = <i className="pi pi-exclamation-triangle" style={{ fontSize: '1.5rem', color:'#FA9522', padding: '0.25rem'  }}></i>;
          msgProb = <div style={{ fontSize: '1.5rem', background:'#FA9522' ,color:'white'}}><p className={styles.msgGravityP}>{ratingProbTxt[0]}</p></div>;
        break;
        case "2":
          icon_prob = <i className="pi pi-exclamation-triangle" style={{ fontSize: '1.5rem', color:'#FF7733', padding: '0.25rem'  }}></i>;
          msgProb = <div style={{ fontSize: '1.5rem', background:'#FF7733' ,color:'white'}}><p className={styles.msgGravityP}>{ratingProbTxt[1]}</p></div>;
        break;
        case "3":
          icon_prob = <i className="pi pi-exclamation-triangle" style={{ fontSize: '1.5rem', color:'#FF5733', padding: '0.25rem' }}></i>;
          msgProb = <div style={{ fontSize: '1.5rem', background:'#FF5733' ,color:'white'}}><p className={styles.msgGravityP}>{ratingProbTxt[2]}</p></div>;
        break;
        case "4":
          icon_prob = <i className="pi pi-exclamation-triangle" style={{ fontSize: '1.5rem', color:'#A00007', padding: '0.25rem'  }}></i>;
          msgProb = <div style={{ fontSize: '1.5rem', background:'#A00007' ,color:'white'}}><p className={styles.msgGravityP}>{ratingProbTxt[3]}</p></div>;
        break;
        case "5":
          icon_prob = <i className="pi pi-exclamation-triangle" style={{ fontSize: '1.5rem', color:'#A00007', padding: '0.25rem'  }}></i>;
          msgProb = <div style={{ fontSize: '1.5rem', background:'#A00007' ,color:'white'}}><p className={styles.msgGravityP}>{ratingProbTxt[4]}</p></div>;
        break;
        default:
          icon_prob = <i className="pi pi-exclamation-triangle" style={{ fontSize: '1.5rem', color:'green', padding: '0.25rem'  }}></i>;
          msgProb = <div style={{ fontSize: '1.5rem', background:'#FA9522' ,color:'white'}}><p className={styles.msgGravityP}>{ratingProbTxt[0]}</p></div>;
        break;
      }

    }else{
      probab = 0;
      icon_prob = <i className="pi pi-exclamation-triangle" style={{ fontSize: '1.5rem', color:'green', padding: '0.25rem'  }}></i>;
      msgProb = <div style={{ fontSize: '1.5rem', background:'#FA9522' ,color:'white'}}><p className={styles.msgGravityP}>{ratingProbTxt[0]}</p></div>;
    }

    
    var rateRisk = impact * probab;

    var TxtImpact = "Impacto: "+impact;
    var TxtProb = "Probabilidad: "+probab;
    var TxtRisk = "Riesgo (Impacto x Probabilidad): "+rateRisk;
    if(lang==false){
      TxtImpact = "Impact: "+impact;
      TxtProb = "Probability: "+probab;
      TxtRisk = "Risk (Impact x Probability): "+rateRisk;
    }

    //RISK
    var rpdf = 0;
    if(isNumber(rateRisk))
    {
      if(parseInt(rateRisk)<3)
      {
        //MUY BAJO 
        msgRisk = <div style={{ fontSize: '1.5rem', background:'#61CD42' ,color:'white'}}><p className={styles.msgGravityP}>{ratingRiskTxt[0]}</p></div>;
      }else{
        if(parseInt(rateRisk)<5)
        {
          //BAJO 
          msgRisk = <div style={{ fontSize: '1.5rem', background:'#228505' ,color:'white'}}><p className={styles.msgGravityP}>{ratingRiskTxt[1]}</p></div>;
          rpdf = 1;
        }else{
          if(parseInt(rateRisk)<10)
          {
            //MEDIO 
            msgRisk = <div style={{ fontSize: '1.5rem', background:'#F5F508' ,color:'white'}}><p className={styles.msgGravityP}>{ratingRiskTxt[2]}</p></div>;
            rpdf = 2;
          }else{
            if(parseInt(rateRisk)<15)
            {
              //ALTO 
              msgRisk = <div style={{ fontSize: '1.5rem', background:'#F5A206' ,color:'white'}}><p className={styles.msgGravityP}>{ratingRiskTxt[3]}</p></div>;
              rpdf = 3;
            }else{
              if(parseInt(rateRisk)<20)
              {
                //MUY ALTO 
                msgRisk = <div style={{ fontSize: '1.5rem', background:'#F51106' ,color:'white'}}><p className={styles.msgGravityP}>{ratingRiskTxt[4]}</p></div>;
                rpdf = 4;
              }else{
                //EXTREMO 
                msgRisk = <div style={{ fontSize: '1.5rem', background:'#8B0C05' ,color:'white'}}><p className={styles.msgGravityP}>{ratingRiskTxt[5]}</p></div>;
                rpdf = 5;
              } 
            } 
          }          
        }
      }
    }else{
      rateRisk = 0;
      msgRisk = <div style={{ fontSize: '1.5rem', background:'#FA9522' ,color:'white'}}><p className={styles.msgGravityP}>{ratingRiskTxt[0]}</p></div>;
    }

    //PDF//
    if(parseInt(rateRisk)>=5)infoPDF.push({"impact":TxtImpact,"probability":TxtProb,"risk":TxtRisk,"rateimp":ratingImpTxt[parseInt(impact)-1],"rateprob":ratingProbTxt[parseInt(probab)-1],"raterisk":ratingRiskTxt[rpdf]});
    infoPDF.push({"impact":TxtImpact,"probability":TxtProb,"risk":TxtRisk,"rateimp":ratingImpTxt[parseInt(impact)-1],"rateprob":ratingProbTxt[parseInt(probab)-1],"raterisk":ratingRiskTxt[0]});
    //

    return(
      <div>
        <div className={styles.enlinea}>
          {TxtImpact}<Rating value={impact} readOnly cancel={false} stars={5}
          onIcon={icon_imp}
          offIcon={<i className="pi pi-exclamation-triangle" style={{ fontSize: '1.5rem', color:'lightgrey', padding: '0.25rem' }}></i>}
          />{msgImpact}
        </div>
        <div className={styles.enlinea}>
          {TxtProb}<Rating value={probab} readOnly cancel={false} stars={5}
          onIcon={icon_prob}
          offIcon={<i className="pi pi-exclamation-triangle" style={{ fontSize: '1.5rem', color:'lightgrey', padding: '0.25rem' }}></i>}
          />{msgProb}
        </div>
        <div className={styles.enlinea}><p>{TxtRisk}</p>
          {msgRisk}
        </div>
      </div>
    );

  };

  const createRisk = () => {    

    var tituloRiesgo = "Evaluación del riesgo";
    var leyendaR = "Proceso utilizado para identificar peligros potenciales y analizar lo que podría ocurrir si se explota la vulnerabilidad detectada.";
    var imageMatrix = "https://wp-website.safetyculture.com/wp-content/uploads/sites/3/2023/12/Ejemplo-de-matriz-de-riesgo-5%C3%975.png";
    var tableRiskTxt = "Matriz de Evaluación del Riesgo";
    if(lang==false){
      tituloRiesgo = "Risk Assessment";
      leyendaR = "Process used to identify potential hazards and analyze what could happen if the detected vulnerability is exploited.";
      imageMatrix = "https://safetyculture.com/_next/image/?url=https%3A%2F%2Fwp-website.safetyculture.com%2Fwp-content%2Fuploads%2Fsites%2F3%2F2023%2F12%2F5x5-Risk-Matrix.png&w=1920&q=75";
      tableRiskTxt = "Risk Assessment Matrix";
    }
    return(
      <div className={styles.panelBordeR}>
        <h2>{tituloRiesgo}</h2>
        <p>{leyendaR}</p>        
        {createRiskRatings()}
        <Panel header={tableRiskTxt} toggleable collapsed>
            <img alt="Risk assessment" src={imageMatrix} style={{ width: '100%'}}/>
        </Panel>               
      </div>
    );
  };

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//BLOQUE 3 DEL DASHBOARD
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  var topOwasp = 0;
  var capec = 0;
  var cwe = 0;
  var tt = [];

  const createPanel3 = () => {

    topOwasp = getObjJson("3.1");
    capec = getObjJson("3.2");
    cwe = getObjJson("3.3");
        
    var TopTxt = "Top OWASP 2021 Ranking: ";  
    var txtTopOWASP2 = "La vulnerabilidad "+nameV+" ocupa el puesto: ";  
    var CapecTxt = "Código CAPEC: ";
    var CweTxt = "Código CWE: ";
    var TTText = "Tácticas & Técnicas (MITRE ATT&CK)";

    if(lang==false){
      TopTxt = "Top OWASP 2021 Ranking: "; 
      txtTopOWASP2 = "The vulnerability "+nameV+" is ranked: ";     
      CapecTxt = "CAPEC: ";
      CweTxt = "CWE: ";
      TTText = "Tactics & Techniques (MITRE ATT&CK)";
    } 

    //PDF//
    infoPDF.push({"top":TopTxt+topOwasp,"capec":CapecTxt+capec,"cwe":CweTxt+cwe});
    //

    if(capec!=null)
    {
    return (
      <TabView>
        <TabPanel header={TopTxt+topOwasp}>
            {getTopOWASP()}
            <p><b>{txtTopOWASP2+topOwasp}</b></p>
        </TabPanel>
        <TabPanel header={CapecTxt+capec}>
            {getCapecInfo()}
        </TabPanel>
        <TabPanel header={CweTxt+cwe}>
            {getCWEInfo()}
        </TabPanel>
        <TabPanel header={TTText}>
          {getTTInfo()}    
        </TabPanel>
      </TabView>
      );
    }else{
     return (
      <TabView>
        <TabPanel header={TopTxt+topOwasp}>
            {getTopOWASP()}
            <p><b>{txtTopOWASP2+topOwasp}</b></p>
        </TabPanel>
        <TabPanel header={CweTxt+cwe}>
            {getCWEInfo()}
        </TabPanel>
        <TabPanel header={TTText}>
          {getTTInfo()}    
        </TabPanel>
      </TabView>
      );
    }


    };

  const getTopOWASP = () => {
    var txtTopOWASP = "El proyecto abierto de seguridad en aplicaciones Web OWASP "+
    "es una comunidad abierta dedicada a facultar a las organizaciones a desarrollar, adquirir y mantener aplicaciones y APIS que pueden ser confiables. "+
    "El OWASP Top 10 es un informe que se actualiza con regularidad y en el que se exponen los problemas de seguridad de las aplicaciones web, "+
    "centrándose en los 10 riesgos más importantes.";    

    if(lang==false)
    {
      txtTopOWASP = "The OWASP Open Web Application Security Project is an open community dedicated to empowering organizations to develop, procure and maintain applications and APIS that can be trusted. The OWASP Top 10 is a regularly updated report exposing web application security issues, focusing on the top 10 risks.";
    }

    return (
      <p>{txtTopOWASP}</p>
    );
  };

  const getCapecInfo = () => {

    var urlCapec = "https://capec.mitre.org/data/definitions/";
    var htmlCapec = ".html";

    var CapecInfoTxt = "CAPEC (Common Attack Pattern Enumeration and Classification) es un diccionario completo y una taxonomía de clasificación de los ataques conocidos que pueden utilizar los analistas, desarrolladores, probadores y educadores para avanzar en la comprensión de la comunidad y mejorar las defensas.";
    var CapecInfoTxt2 = "A continuación puede encontrar más información sobre el código CAPEC que corresponde a la vulnerabilidad "+nameV+".";

    var CapecCode = getObjJson("3.2");

    if(lang==false)
    {
      CapecInfoTxt = "CAPEC (Common Attack Pattern Enumeration and Classification) is a comprehensive dictionary and classification taxonomy of known attacks that can be used by analysts, developers, testers and educators to advance community understanding and improve defenses.";
      CapecInfoTxt2 = "More information about the CAPEC code related to the vulnerability "+nameV+" can be found below.";
    }

    return (
      <div>
      <p>{CapecInfoTxt}</p>
      <p><b>{CapecInfoTxt2}</b></p>
      <p><a href={urlCapec+CapecCode+htmlCapec} target="_blank" rel="noopener noreferrer">CAPEC-{CapecCode}</a></p>
      </div>
    );
  };

  const getCWEInfo = () => {

    var urlCwe = "https://cwe.mitre.org/data/definitions/";
    var htmlCwe = ".html";

    var CweInfoTxt = "CWE (Common Weakness Enumeration) es una lista de debilidades comunes de software y hardware. Una debilidad es una condición en un componente de software, firmware, hardware o servicio que, bajo ciertas circunstancias, podría contribuir a la introducción de vulnerabilidades. La Lista CWE y la taxonomía de clasificación asociada identifican y describen las debilidades en términos de CWE.";
    var CweInfoTxt2 = "A continuación puede encontrar más información sobre el CWE que corresponde a la vulnerabilidad "+nameV+".";

    var CweCode = getObjJson("3.3");

    if(lang==false)
    {
      CweInfoTxt = "CWE (Common Weakness Enumeration) is a list of common software and hardware weaknesses. A weakness is a condition in a software, firmware, hardware or service component that, under certain circumstances, could contribute to the introduction of vulnerabilities. The CWE List and associated classification taxonomy identify and describe weaknesses in terms of CWE.";
      CweInfoTxt2 = "More information about the CWE related to the vulnerability "+nameV+" can be found below.";
    }

    return (
      <div>
      <p>{CweInfoTxt}</p>
      <p><b>{CweInfoTxt2}</b></p>
      <p><a href={urlCwe+CweCode+htmlCwe} target="_blank" rel="noopener noreferrer">CWE-{CweCode}</a></p>
      </div>
    );
  };

  const getTTInfo = () => {

    var urlTac = "https://attack.mitre.org/tactics/";
    var urlTec = "https://attack.mitre.org/techniques/";
    var tec;

    if(!getObjJson("3.4").length>1) tec= getObjJson("3.4").split(",");
    else tec= getObjJson("3.4");

    var tac = getObjJson("3.5");
    var listaTac = [];
    var hrefTec = [];
    var TTText="";
    var TTText2="A continuación puede encontrar las técnicas y tácticas de MITRE ATT&CK correspondientes a la vulnerabilidad detectada: "+nameV+".";

    for(let i = 0; i<tac.length; i++)
    {
      listaTac.push(tac[i].toString());

      for(let j = 0; j<tec.length; j++)
      {        
        var tecnica = tec[j].toString();
        //console.log(tac[i].toString()+" incluye? "+tecnica+" :"+tac[i].toString().includes(tecnica));
        if(tac[i].toString().includes(tec[j].toString()))
        {          
          hrefTec[i]=urlTec+tec[j].toString();
        }
      }
    }

    TTText = "El marco MITRE ATT&CK es una base de conocimientos universalmente accesible y continuamente actualizada para modelar, detectar, "+
    "prevenir y combatir amenazas de ciberseguridad basándose en el comportamiento conocido de los ciberdelincuentes adversarios. "+
    "Las siglas ATT&CK de MITRE ATT&CK significan tácticas, técnicas y saber generalizado del adversario.";
    
    if(lang==false){
      TTText="The MITRE ATT&CK framework is a universally accessible and continuously updated knowledge base for modeling, detecting, preventing, and combating cybersecurity threats based on the known behavior of adversarial cybercriminals. (The acronym ATT&CK in MITRE ATT&CK stands for tactics, techniques, and generalized adversary knowledge).";
      TTText2="Below you can find MITRE ATT&CK's techniques and tactics corresponding to the detected vulnerability: "+nameV+".";
    }

    //PDF//
    infoPDF.push({"tt":listaTac});
    //

    return (
      <div>
      <p>{TTText}</p>
      <p><b>{TTText2}</b></p>
      <p><a href={hrefTec[0]} target="_blank" rel="noopener noreferrer">{listaTac[0]}</a></p>
      <p><a href={hrefTec[1]} target="_blank" rel="noopener noreferrer">{listaTac[1]}</a></p>
      <p><a href={hrefTec[2]} target="_blank" rel="noopener noreferrer">{listaTac[2]}</a></p>
      <p><a href={hrefTec[3]} target="_blank" rel="noopener noreferrer">{listaTac[3]}</a></p>
      <p><a href={hrefTec[4]} target="_blank" rel="noopener noreferrer">{listaTac[4]}</a></p>
      <p><a href={hrefTec[5]} target="_blank" rel="noopener noreferrer">{listaTac[5]}</a></p>
      </div>
    );
  };

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//BLOQUE 4 DEL DASHBOARD
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  var withoutVul = "";
  var explanation = "";

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
//BLOQUE 5 DEL DASHBOARD
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  var test = [];
  var test_tools = [];

const createPanel4 = () => {

    var codeCorrectTxt = "Solución de la vulnerabilidad";
    var penTxt = "Pentesting";
    var toolTxt = "Herramientas de testeo";

    if(lang==false){
      codeCorrectTxt = "Vulnerability Solution";
      penTxt = "Pentesting";
      toolTxt = "Testing Tools";
    } 

    return (
      <TabView>
        <TabPanel header={codeCorrectTxt}>
          {getCorrectCode()}
        </TabPanel>
        <TabPanel header={penTxt}>
          {getPentesting()}
        </TabPanel>
        <TabPanel header={toolTxt}>
          {getTestTools()}
        </TabPanel>       
      </TabView>
      );

};

const getCorrectCode = () => {

  var correctCodeTxt = "Se propone a continuación una posible solución para la vulnerabilidad detectada "+nameV+":";
  var explainTxt = "Explicación:";

  if(lang==false)
  {
    correctCodeTxt = "The following is a possible solution for the detected vulnerability "+nameV+":";
    explainTxt = "Explanation:";
  }

  withoutVul = getObjJson("4.1");
  var codec = [];
  if(withoutVul.toString().includes(";"))
  {
    codec = withoutVul.split(";");
  }

  const list = codec.map((item,i) => <div key={i}>{item}</div>)

  explanation = getObjJson("4.2");

  //PDF//
  infoPDF.push({"correct":codec,"explanation":explanation});
  //

  return (
    <div>
      <p>{correctCodeTxt}</p>
      <div className={styles.terminal}>
        {list}
      </div>
      <p><b>{explainTxt}</b></p>{explanation}
    </div>
  );
};

const getPentesting = () => {

  var penTxt = "El pentesting, también conocido como prueba de penetración, consiste en la simulación de un ataque a un sistema software o hardware con el objetivo de encontrar vulnerabilidades para prevenir ataques externos."; 
  var penTxt2 = "A continuación puede encontrar una lista con algunas pruebas de pentesting que puede poner en práctica para comprobar si la vulnerabilidad "+nameV+" sigue existiendo:";
  
  if(lang==false)
  {
    penTxt = "Pentesting, also known as penetration testing, is the simulation of an attack on a software or hardware system with the objective of finding vulnerabilities to prevent external attacks.";
    penTxt2 = "Below you can find a list with some pentesting tests that you can implement to check if the vulnerability "+nameV+" still exists:";
  }

  var penlist;

  if(!getObjJson("5.1").length>1) penlist= getObjJson("5.1").split(",");
  else penlist= getObjJson("5.1");

  const list = penlist.map((item,i) => <li key={i}>{item}</li>)

  //PDF//
  infoPDF.push({"pentesting":penlist});
  //

  return (
    <div>
      <p>{penTxt}</p>
      <p><b>{penTxt2}</b></p>
      <ul>
        {list}
      </ul>
    </div>
  );
};

const getTestTools = () => {

  var urlTools = "https://www.google.com/search?q=";

  var ttoolsTxt = "A continuación puede encontrar una lista de herramientas para realizar las pruebas de Pentesting propuestas:";
  if(lang==false) ttoolsTxt = "Below you can find a list of tools to perform the proposed Pentesting tests:";

  var toollist;

  if(!getObjJson("5.2").length>1) toollist= getObjJson("5.2").split(",");
  else toollist= getObjJson("5.2");

  //PDF//
  infoPDF.push({"tools":toollist});
  //

  const list = toollist.map((item,i) => <li key={i}><a href={urlTools+item} target="_blank" rel="noopener noreferrer">{item}</a></li>)
  return (
    <div>
      <p><b>{ttoolsTxt}</b></p>
      <ul>
        {list}
      </ul>
    </div>
  );
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////

//Fase 0 Instrucciones, skeleton e inputs
//Fase 1 Procesando
//Fase 2 Error en la entrada
//Fase 3 Existe vulnerabilidad - Dashboard
//Fase 4 No existe vulnerabilidad
const [phase, setPhase] = useState(0);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
const [titulo, setTitulo] = useState("AI Code Analyzer");

////////////////////////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////////////////////////
switch(phase){
  case 0:
  
  //ESTADO INSTRUCCIONES
  var InsTitle = "Instrucciones";
  var InsTxt = "Bienvenido al Analizador de vulnerabilidades de código con Inteligencia Artificial. \n\r Por favor, introduzca el código a analizar en la caja de texto que puede encontrar en la parte inferior de la ventana.";
  var InputTxt = "Introduce aquí el código...";
  var AnalButtonTxt ="Analizar";
  if(lang==false)
  {
    InsTitle = "User Instructions";
    InsTxt = "Welcome to the Artificial Intelligence Code Vulnerability Analyzer. \n\r Please, enter the code to be analyzed in the textfield that can be found at the bottom of the window.";
    InputTxt = "Enter the code here...";
    AnalButtonTxt ="Analyze";
  }

  return (
  <div id="root">

      <Head>
        <title>{titulo}</title>
      </Head>

      <div id="previsualization" className="">
        <div id="idioma" className={styles.closeInput}>
          <ToggleButton checked={lang} onLabel="EN" offLabel="ES" onChange={(e) => setLanguage(e.value)} />
        </div>
        <div id="instructions" className={styles.instructions}>
          <h3>{InsTitle}</h3>
          <p>{InsTxt}</p>
        </div>
        <div id="skeleto" className={styles.skeleto}>
            <Skeleton width="100%" height="2rem" margin="1rem"></Skeleton>
            <br/>
            <Skeleton width="70%" height="5rem"></Skeleton>
            <br/>
            <Skeleton width="70%" height="3rem"></Skeleton>
            <br/>
            <Skeleton width="50%" height="5rem"></Skeleton>
            <br/>
            <Skeleton width="60%" height="2rem"></Skeleton>
            <br/>
        </div>        
      </div>

      <div id="inputframe">      
        <div className={styles.messageInputContainer}>          
          <form onSubmit={onSubmit}> 
            <textarea
              className={styles.textarea}
              name="message"
              placeholder={InputTxt}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            ></textarea>
            <div className={styles.buttonGroup}>
              <input className={styles.inputSubmit} type="submit" value={AnalButtonTxt} />
            </div> 
          </form>        
        </div>
      </div>     

    </div>
  );

  break;
  case 1: 

  // ESTADO PROCESANDO, PUEDE AVANZAR A PASO 3 O SI REGISTRA ERROR EN LA ENTRADA VA A PASO 2
  var InsTxt1 = "Procesando el análisis...";
  var InsTxt2 = "Por favor, espere unos segundos.";  
  if(lang==false)
  {
    InsTxt1 = "Processing the analysis...";
    InsTxt2 = "Please, wait for a moment.";
  }

  return (
  <div id="root">

      <Head>
        <title>{titulo}</title>
      </Head>
      <div id="processing_message" className={styles.generalMessage}>
        <p>{InsTxt1}<i className="pi pi-spin pi-cog" style={{ fontSize: '2rem' }}></i><br/><br/>{InsTxt2}</p>
      </div>

    </div>
  );

  break;
  case 2: 

  // ERROR EN LA ENTRADA VUELVE A PASO 0
  var ErrTxt1 = "Error en la entrada de código.";
  var ErrTxt2 = "Por favor, vuelva a intentarlo.";  
  
  if(lang==false)
  {
    ErrTxt1 = "The input failed...";
    ErrTxt2 = "Please, try again.";    
  }

  return (
  <div id="root">

      <Head>
        <title>{titulo}</title>
      </Head>
      <div id="error_message" className={styles.generalMessage}>
        <p><i className="pi pi-times-circle" style={{ color: 'red', fontSize: '2rem' }}></i> {ErrTxt1} <br/><br/> {ErrTxt2} </p>
        <button className={styles.inputButton} type="button" onClick={init}> {BackButtonTxt} </button>
      </div>

    </div>
  );

  break;
  case 3:  
  // ESTADO DASHBOARD 
  return (
  <div id="root">

      <Head>
        <title>{titulo}</title>
      </Head>

      <div id="dashboard">
        <div id="vul_card" className="card flex justify-content-center">{createVulCard()}</div>
        
        <div id="panel_1" className="" style={{ marginTop: '1em'}}>
          {createPanel1()}
        </div>        

        <div id="panel_3" className="" style={{ marginTop: '1em'}}>
          {createPanel3()}
        </div>

        <div id="panel_3" className="" style={{ marginTop: '1em'}}>
          {createPanel4()}
        </div>

        <div id="panel_2" style={{ marginTop: '1em'}}>
          {createPanel2()}
        </div>

      </div>

    </div>
  );
  break;
  case 4:  
  // EL CODIGO NO ES VULNERABLE, VUELVE A PASO 0
  var NoVulTxt1 = "El código no presenta vulnerabilidades...";
  var NoVulTxt2 = "Por favor, pulse 'Volver' para intentarlo de nuevo.";  
  //var BackButtonTxt = "Volver";
  if(lang==false)
  {
    NoVulTxt1 = "The code has no vulnerabilities...";
    NoVulTxt2 = "Please click 'Back' to try again.";
    //BackButtonTxt = "Back";
  }

  return (
  <div id="root">

      <Head>
        <title>{titulo}</title>
      </Head>
      <div id="noVul_message" className={styles.generalMessage}>
        <p> <i className="pi pi-verified" style={{ color: 'green', fontSize: '1.5rem' }}></i> {NoVulTxt1}<br/><br/> {NoVulTxt2}</p>
        <button className={styles.inputButton} type="button" onClick={init}> {BackButtonTxt} </button>
      </div>

    </div>
  );
}
  
}

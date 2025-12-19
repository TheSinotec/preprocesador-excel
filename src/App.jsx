import { useState, useEffect } from 'react'
import './App.css'
import * as XLSX from 'xlsx' 

function App() {
  const [data, setData] = useState([]);
  const [sample, setSample] = useState(["Id", "Usuario", "Grupo", "POBLACIÓN", "Nombre completo", "nombre", "apellido paterno", "apellido materno", "correo electrónico", "certificación", "plataforma", "curp", "sexo", "fecha de nacimiento", "edad", "estado", "municipio", "cp", "telefono", "area de procedencia", "carrera", "avance", "certificado", "constancia enviada", "reasignada"]);
  const [dataFinal, setDataFinal] = useState({});

  function columnName(num){
    /**
     * Convierte un numero en un caracter base 27 nativo de Excel (Hasta 701 == ZZ)
     * @param {Integer} num - Numero a convertir en base 27
     * @returns {string} El codigo base 27
     * @throws {undefined} Si el Excel posee mas de 701 columnas
    */
    const abc = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (Math.floor(num / 26) !== 0){
              return (abc[Math.floor(num / 26) - 1] + abc[num % 26]);
            } else{
              return (abc[num % 26]);
            }
  }

  function read(){
    /**
     * Lee un archivo *.xlsx | *.xls y lo convierte en un diccionario de listas de diccionarios para manejar los datos 
     * de cada hoja, columna y registro {data := {nombre_hoja: <lista[diccionario_registros]>}}
     * Actualiza el estado de << data >>
     * @returns {null} No retorna
    */
    var file = document.getElementById('fileUpload');
    var reader = new FileReader();
    if (file.files.length !== 0) {
      if (file.files[0].name.split('.').pop() === "xlsx" || file.files[0].name.split('.').pop() === "xls" ){
        reader.readAsArrayBuffer(file.files[0]);
        reader.onloadend = (e) => {
          var data = new Uint8Array(e.target.result);
          var excelRead = XLSX.read(data, {type: 'array'});
          var dataExport = {};
          for (var noSheet in excelRead.SheetNames){
            var firstSheet = excelRead.Sheets[excelRead.SheetNames[noSheet]];
            var i = -1;
            var column = "";
            for (var key in firstSheet) {
              if (key.substring(0, 1) != "!"){
                i++;
                column = columnName(i);
                if (key.substring(0, key.length - 1) !== column){
                  column = columnName(i-1);
                  break;
                }
              }
            }
            if (i === -1){
              file.value = "";
            } else {
              var dataSheet = [];
              var sample_sheet = [];
              for (var columns = 0; columns < i; columns++){
                var cellName = columnName(columns)+"1";
                try {
                  sample_sheet.push(firstSheet[cellName]["v"]);
                } catch (error) {
                  sample_sheet.push(cellName);
                }
              }
              var totalRows = parseInt(firstSheet["!ref"].substring(3).match(/(\d+)/g)[0]);
              for (var rows = 2; rows < totalRows + 1; rows++){
                var register = {};
                for (var columns = 0; columns < i; columns++){
                  var cellName = columnName(columns)+rows.toString();
                  try {
                    register[sample_sheet[columns]] = firstSheet[cellName]["v"];
                  } catch (error) {
                    register[sample_sheet[columns]] = null;
                  }
                }
                dataSheet.push(register);
              }
              dataExport[excelRead.SheetNames[noSheet]] = dataSheet;
            }
          }
          setData(dataExport);
          clearSelects();
        }
      } else {
        alert("extension invalida");
        file.value = "";
      }
    } else {
      file.value = "";
    }
  }

  function chargeData(){
    /**
     * Funcion para garantizar generar el modelo de datos de columnas independientes, genera un diccionario si no se han guardado datos
     * en otro caso, solo refresca la visualizacion de la plantilla.
     * Actualiza el estado de << dataFinal >> o << sample >>
     * @returns {null} No retorna
    */
    if (Object.keys(dataFinal).length === 0){
      var dataPrev = {};
      sample.map((sampleKey) => {
        dataPrev[sampleKey] = [];
      });
      setDataFinal(dataPrev);
    } else {
      var dataPrev = [];
      sample.map((sampleKey) => {
        dataPrev.push(sampleKey);
      });
      setSample(dataPrev);
    }
  }

  function exportData(){
    /**
     * Funcion para generar y exportar los datos acumulados en << dataFinal >>, genera una lista de diccionarios segun la plantilla << sample >>
     * @returns {null} No retorna
    */
    var empty = true;
    var max = 0;
    Object.keys(dataFinal).map((key) => {
      var long = dataFinal[key].length;
      if (long > max) {
        max = long
      }
      if (long == 0) {
        empty = false;
      }
    }) 
    if (!!!empty) {
      empty = confirm("Faltan datos en las columnas ¿Desea exportar de todos modos?");
    }
    if (empty) {
      var dataExport = []
      for (var i = 0; i < max; i++) {
        var block = {}
        Object.keys(dataFinal).map((key) => {
          try {
            block[key] = dataFinal[key][i];
          } catch (error) {
            block[key] = null;
          }
        })
        dataExport.push(block);
      }
      alert("Se exportó.")
      //AQUI SE DEBE CONECTAR AL ENDPOINT
      console.log(dataExport); // <-- Lista de diccionarios //DEBE REEMPLAZARSE
    }
  }

  function takeValues(sheetName, columnName){
    /**
     * Funcion auxiliar genera una lista con todos los registros de una hoja y columna dadas en << data >>
     * @param {string} sheetName - Nombre de la pagina
     * @param {string} columnName - Nombre de la columna
     * @returns {list<Any>} Una lista con todos los registros de la hoja << sheetName >> cuya columna sea << columnName >>
     * @throws {Error} No existen los campos en << data >>
    */
    var listData = [];
    data[sheetName].map((item) => {
      listData.push(item[columnName]);
    });
    return listData;
  }

  function addColumns(sheetName, sheetIndex){
    /**
     * Funcion que agrega todas las columnas seleccionadas de una pagina de Excel adjunta a los datos a exportar (<< dataFinal >>)
     * @param {string} sheetName - Nombre de la pagina
     * @param {string} columnName - Numero de la pagina (sirve como clave unica en los selectores dinamicos)
     * @returns {null} No retorna
     * @throws {Error} No hay restriccion de elementos repetidos, el ultimo es el que sobreescribe el valor de la columna
    */
    var dataPrev = dataFinal;
    var columns = Object.keys(data[sheetName][0]);
    columns.map((item, index) =>{
      var select = document.getElementById(sheetIndex.toString() + "_" + index);
      if (select.value !== "slc-1"){
        var dataColumn = takeValues(sheetName, item);
        dataPrev[sample[select.value.slice(3, select.value.length)]] = dataColumn;
        select.value = "slc-1";
      }
    });
    setDataFinal(dataPrev);
    chargeData();
  }

  function clearSelects() {
    /**
     * Funcion auxiliar que 'des-selecciona' los selectores
     * @returns {null} No retorna
    */
    var selectElements = document.querySelectorAll('select');
    for (var select of selectElements) {
      select.value = "slc-1";
    }
  }

  function exportDoc(){
    /**
     * Funcion que envía el documento completo añadido a registro
     * @returns {null} No retorna
    */
    var formData = new FormData(document.forms.namedItem("fileinfo"));
    //SE ENVÍA EL DOCUMENTO AL ENDPOINT 
    //DEBE SUSTITUIRSE LA CONEXIÓN POR LA PROPIA DE REACT
    var request = new XMLHttpRequest();
    request.open("POST", "http://127.0.0.1:8000/api/carga-alumnos/");
    request.send(formData);
    request.onload = function (oEvent) {
      alert("Status del envío: " + request.statusText);
    };
  }

  const hasRecords = (data.length !== 0);
  const hasSample = (sample.length !== 0);


  useEffect(() => {
    chargeData();
  }, []);

  return (
    <>
      {
        hasSample ? (
          <div>
            <>
              <div className="section-header">
                <h2>Plantilla para exportación de datos</h2>
                <button onClick={() => (exportData())}>Exportar Datos</button>
              </div>
              <div className="tabla-scroll-wrapper tabla-data-scroll-vertical">
                <table className="tabla-container">
                  <thead>
                    <tr>
                      {sample.map((item) => (
                        <th key={item}>
                          {JSON.stringify(item)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                        {
                            Object.values(dataFinal)
                                .reduce((max, arr) => Math.max(max, arr.length), 0) > 0 ? (

                                    // 3. Iterar hasta la fila máxima que tenga datos
                                    [...Array(
                                        Object.values(dataFinal).reduce((max, arr) => Math.max(max, arr.length), 0)
                                    ).keys()].map(rowIndex => (
                                        <tr key={rowIndex}>
                                            {sample.map((columnName) => (
                                                <td key={columnName}> {/* Mostrar el dato real o vacío */}
                                                    {JSON.stringify(dataFinal[columnName][rowIndex] || null)}
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : (
                                    // 4. Mostrar una fila "Vacío" si no hay datos (solo la fila de headers)
                                    <tr>
                                        {sample.map((item) => (
                                            <td key={item} className='boton-muestra'>
                                                Vacío
                                            </td>
                                        ))}
                                    </tr>
                                )
                        }
                  </tbody>
                </table> 
              </div>
            </>
          </div>
        ) : (
          <div>
            NO DATA
          </div>
        )
      }
      <div className="section-data-import">
        <h2>Importación de datos</h2>
        <div className="card">
          <form encType="multipart/form-data" method="post" name="fileinfo">
            <input type="file" id="fileUpload" name="file" accept=".xls,.xlsx" required></input>
         </form>
         <button onClick={read}>
            SUBIR
          </button>
        </div>
      </div>
      {
        hasRecords ? (
          <div>
            <button onClick={()=>(exportDoc())}>Exportar doucmento entero</button>
            {Object.keys(data).map((key, keyindex) => ( 
              <>
                <div className="table-page-header">
                  <h3>{key}</h3> 
                  <button onClick={()=>(addColumns(key, keyindex))}>Agregar columnas</button>
                </div>  
                  <div className=" tabla-scroll-wrapper tabla-data-scroll-vertical">
                    <table className="tabla-container">
                      {data[key].map((item, index) => (
                      <><thead>
                          {index === 0 ? (
                          <><tr>
                              {Object.keys(item).map((col, colindex) => (
                                <th>
                                  <select id={keyindex.toString()+"_"+colindex}>
                                    <option value="slc-1" selected>
                                      Ninguna
                                    </option>
                                    {sample.map((column, columnindex) => (
                                      <option value={"slc"+columnindex}>
                                        {column}
                                      </option>
                                    ))}
                                  </select>
                                </th>
                              ))}
                            </tr>
                            <tr>
                              {Object.keys(item).map((col) => (
                                <th>
                                  {JSON.stringify(col)}
                                </th>
                              ))}
                            </tr></>):(<></>)}
                        </thead>
                        <tbody>
                            <tr>
                              {Object.keys(item).map((col) => (
                                <td>
                                  {JSON.stringify(item[col])}
                                </td>
                              ))}
                            </tr>
                        </tbody></>
                      ))}
                    </table> 
                  </div>
              </>
            ))}
          </div>
        ) : (
          <div>
            NO DATA
          </div>
        )
      }
    </>
  )
}

export default App

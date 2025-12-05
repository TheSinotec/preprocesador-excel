import { useState, useEffect } from 'react'
import './App.css'
import * as XLSX from 'xlsx' 

function App() {
  const [data, setData] = useState([]);
  const [sample, setSample] = useState(["Columna 1", "Columna 2", "Columna 3", "Columna 4", "Columna 5"]);
  const [dataFinal, setDataFinal] = useState({});

  function columnName(num){
    // Función obtener nombre de columna en formato excel
    const abc = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (Math.floor(num / 26) !== 0){
              return (abc[Math.floor(num / 26) - 1] + abc[num % 26]);
            } else{
              return (abc[num % 26]);
            }
  }

  function read(){
    //Prototipo 2: Lectura general de excel
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
      console.log(dataExport);
    }
  }

  function takeValues(sheetName, columnName){
    var listData = [];
    data[sheetName].map((item) => {
      listData.push(item[columnName]);
    });
    return listData;
  }

  function addColumns(sheetName, sheetIndex){
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
    var selectElements = document.querySelectorAll('select');
    for (var select of selectElements) {
      select.value = "slc-1";
    }
  }

  const hasRecords = (data.length !== 0);
  const hasSample = (sample.length !== 0);


  useEffect(() => {
    chargeData();
  }, []);

  return (
    <>
      <div className="card">
        <input type="file" id="fileUpload" name="archivo" accept=".xls,.xlsx" required></input>
        <button onClick={read}>
          SUBIR
        </button>
      </div>
      {/*
      <div className="card">
        <button onClick={downloadFile}>
          BAJAR
        </button>
      </div>*/}
      {
        hasSample ? (
          <div>
            <><p>Plantilla <button onClick={() => (exportData())}>Exportar Datos</button> </p>
              <table className="tabla-container">
                <thead>
                  <tr>
                    {sample.map((item) => (
                      <th>
                        {JSON.stringify(item)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    {sample.map((item) => (
                      <td>
                        {JSON.stringify(dataFinal[item])}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table> 
            </>
          </div>
        ) : (
          <div>
            NO DATA
          </div>
        )
      }
      {
        hasRecords ? (
          <div>
            {Object.keys(data).map((key, keyindex) => ( 
              <><p>{key} <button onClick={()=>(addColumns(key, keyindex))}>Agregar columnas</button> </p>
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

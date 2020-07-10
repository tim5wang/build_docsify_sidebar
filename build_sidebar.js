/**
 * @author tim5wang
 * 用于自动生成 docsify的 `_sidebar.md` 格式目录文件
 * 1. 支持多层目录嵌套，在根目录生成全局目录树 `./_sidebar.md`
 * 2. 在每层子目录生成该目录的 `子目录/_sidebar.md` 和 `README.md`
 * 3. 在根目录索引全部图片文件路径 `_images.md` 和 `_images.txt`
 * 
 * `_sidebar.md` 内容格式定义如下：
 * 
 * 文件层次用`-`前面的空格数表示n级列表 
 * ```md
 * - [目录名](完整目录/) 
 *  - [文件名1](完整目录/文件名1.md) 
 *  - [文件名2](完整目录/文件名2.md) 
 *  - [子目录名](完整子目录/)
 *   - [文件名3](完整目录/文件名3.md)
 * ```
 * 
 * 对应的`EADME.md` 内容格式定义如下：
 * 
 * 文件层次用标题级别表示: 如三层目录 ### [底层目录名](完整三级目录/)
 * ```md
 * # [目录名](完整目录/) 
 * ## [文件名1](完整目录/文件名1.md) 
 * ## [文件名2](完整目录/文件名2.md) 
 * ## [子目录名](完整子目录/)
 * ###[文件名3](完整目录/文件名3.md)
 * ```
 * 
 * 图片文件索引 `_images.md`
 * ```md
 * ![图片1名](图片1完整路径)
 * ![图片2名](图片2完整路径)
 * ```
 * 
 * 图片文件索引 `_images.txt`
 * 
 * 图片1完整路径
 * 图片2完整路径
 */

const fs = require("fs");
const path = require('path');

const IMG_EXTS = ['.png','.jpg','.jpeg','.gif','.bmp']
const MD_IGNORE = ['_sidebar.md','README.md','_images.md','_coverpage.md']
const INDEX_EXT = ['.md','.MD','.markdown']


const maxDeepOfBase = 4;
const _file = "_sidebar.md";
// var floder = "计算机基础/";
var ltrim = "\n- ";

function buildSingleFloder(floder,file,ltrim){
    fs.readdir(floder, function (err, data) {
        console.log(err);
        console.log(data);
    
        var content = formatSiderbarContent(floder,data,ltrim);
    
        console.log(content);
        
        writeToFile(floder + file,content);
    });
}


//  buildSingleFloder(floder,_file,ltrim)
function writeToFile(file,content){
    fs.writeFile(file, content, error => {
    if (error) {
        console.log("写入失败");
    } else {
        console.log("写入成功了");
    }
    });
}


function formatSiderbarContent(floder,dir,ltrim){
    var doc = ""
    dir.forEach((item,index)=>{
        const ext = item.substring(item.length-3);
        if(ext !='.md' && ext != '.MD' ) return;
        if(item == '_sidebar.md') return;
        if(item == '_coverpage.md') return;
        if(item == 'README.md') return;
        const file = item.substring(0,item.length-3);
        if(ltrim) doc += ltrim;
        doc += "[";
        doc += file;
        doc += "]";
        doc += "(";
        doc += floder+item;
        doc += ")";
        doc += "\n";
    });
    return doc;
}

// 异步遍历
function travelNotSyn(dir, callback, finish) {
    fs.readdir(dir, function (err, files) {
        (function next(i) {
            if (i < files.length) {
                var pathname = path.join(dir, files[i]);

                fs.stat(pathname, function (err, stats) {
                    if (stats.isDirectory()) {
                        travelNotSyn(pathname, callback, function () {
                            next(i + 1);
                        });
                    } else {
                        callback(pathname, function () {
                            next(i + 1);
                        });
                    }
                });
            } else {
                finish && finish();
            }
        }(0));
    });
}

// 同步遍历
function travelSyn(deep, dir, callback) {
    fs.readdirSync(dir).forEach(function (file) {
        var pathname = path.join(dir, file);
        if (fs.statSync(pathname).isDirectory()) {
            callback(pathname,deep,true);
            travelSyn(deep+1, pathname, callback);
        } else {
            callback(pathname,deep,false);
        }
    });
}

// multiple str
function ms(str,n){
    let res="";
    while(n-->0){
        res+=str;
    }
    return res;
}

// get extension
function ext(str){
    const index = str.lastIndexOf('.');
    if(index<0) return "";
    return str.substring(index);
}

// get filename
function filename(str,noExt){
    let res=str;
    const index1 = str.lastIndexOf('/');
    
    if(index1!=-1){
        res = str.substring(index1+1)
    }
    if(noExt){
        const index2 = res.lastIndexOf('.');
        res = res.substring(0,index2);
    }
    return res;
}

// get path
function pathes(f){
    let ps=[]
    for(var i=0;i<f.length;i++){
        if(f[i]=='/'){
            ps.push(f.substring(0,i))
        }
    }
    return ps
}

// get last path
function getLastPath(f){
    const ps = pathes(f);
    if(ps==0) return '';
    let lastPathFull = ps.pop();
    const index = lastPathFull.lastIndexOf('/');
    if(index==-1) return lastPathFull;
    return lastPathFull.substring(index+1)
}

// remove item
function removeItem(array,item){
    array.filter(obj=>{
        return obj != item;
    })
}

function travelFloder(pt){
    
    var docs = []
    var imgs = []
    var dirs = []

    travelSyn(1,pt,(pname, deep, isDir)=>{
        if(pname[0]=='.') return;
        var reg = new RegExp("\\\\","g");
        pname = pname.replace(reg,'/');
        if(isDir){
            dirs.push(pname+'/')
        }else{
            const ext_ = ext(pname);
            if(INDEX_EXT.indexOf(ext_) != -1){
                const cname = filename(pname);
                if(MD_IGNORE.indexOf(cname) == -1 ){
                    docs.push(pname);
                }
            }
            if(IMG_EXTS.indexOf(ext_) != -1){
                imgs.push(pname)
            }
        }
    })
    return [docs,imgs,dirs]   
}


function imgsContent(imgs){
    var images = ""
    var images_ = ""

    imgs.forEach(img=>{
        images += `![${filename(img)}](${img})\n\n`;
        images_ += `${img}\n`;
    });

    return [images,images_]
}


function docsContent(docs){
    var content = ""
    var content_ = ""
    var dirExist=[]
    docs.forEach(doc=>{
        let ps = pathes(doc);
        if(ps.length>0){
            let p = ps[ps.length-1];
            if(dirExist.indexOf(p)==-1){
                dirExist.push(p);
                content_ += `${ms(' ',ps.length-1)}- [${getLastPath(doc)}](${p}/)\n\n`;
                content += `${ms(' ',ps.length-1)}- [${getLastPath(doc)}](${p}/)\n\n`;
            }
        }
        content_ += `${ms(' ',ps.length)}- [${filename(doc,true)}](${doc})\n\n`;
        content += `${ms(' ',ps.length)}- [${filename(doc,true)}](${doc})\n\n`;
    })
    return [
        content,
        content_,
        dirExist
    ]
}


function recurTravel(floder,pr){
    const res = travelFloder(floder);
    const docc = docsContent(res[0]);
    console.log(docc)

    docc[2].forEach(fl=>{
        if(fl != floder){
            recurTravel(fl,floder)
            // console.log(fl)
        }
    })

    if(pr){
        if(pr == './'){
            const content_rm = `< [上一级](README.md) \n\n`;
            docc[0] = content_rm+docc[0];
            const content_sb = `< [上一级](README.md) \n\n`;
            docc[1] = content_sb+docc[1];
        }else{
            const pn = getLastPath(pr);
            const content_rm = `< [${pn}](${pr}) \n\n`;
            docc[0] = content_rm+docc[0];
            const content_sb = `< [${pn}](${pr}) \n\n`;
            docc[1] = content_sb+docc[1];
        }
    }

    let fld = floder;
    if(fld[fld.length-1] != '/') fld += '/';

    writeToFile(fld+'_sidebar.md',docc[0]);
    writeToFile(fld+'README.md',docc[1]);

    if(floder == './'){
        const ic = imgsContent(res[1]);
        writeToFile(floder+'_images.md',ic[0]);
        writeToFile(floder+'_images.txt',ic[1]);
    }
}

recurTravel('./')
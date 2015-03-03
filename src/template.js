(function(){

    var toString = ({}).toString;
    var cacheModule = [];
    var variableModule = {$out:1};

    var defaultConfig = template.defaultConfig = {
        openTag  : '<%',
        closeTag : '%>',
        compress : true,
        cache    : true
    }
    var headerCode = "'use strict';var ";
    var mainCode;
    var footerCode = "return $out;";
    var code = '';

    function template(id, data){

        var fn = render(id) || errorInfo({
            templateID : id,
            name       : 'Render Error',
            message    : 'Template not found'
        });

        return data ? fn(data) : fn;
    }

    function render(id){
        var cache = cacheModule[id];

        if(!cache){
            var elem = document.getElementById(id);
            if(elem){
                var source = elem.innerHTML;
                //去除前后的空格
                source = source.replace(/^\s*|\s*$/g, '');
                cache = compile(source, {id:id});
            }
        }

        return cache;
    }

    function config(obj){
        for(var name in obj){
            if(defaultConfig[name]){
                defaultConfig[name] = obj[name];
            }
        }
    }

    function compile(source, options){
        var openTag = defaultConfig.openTag;
        var closeTag = defaultConfig.closeTag;
        mainCode = '';
        each(source.split(openTag),function(str){
            str = str.split(closeTag);
            //console.log(str);
            if(str.length > 1){
                //logic + html
                mainCode += logic(str[0]);
                mainCode += html(str[1]);
            }else{
                //html
                mainCode += html(str[0]);
                //console.log(mainCode);
            }
        });

        code = headerCode + "$out='';" + mainCode + footerCode;
        try {
            var renderFn = new Function("$data", code);
            return renderFn;
        } catch (e) {
            throw e;
        }
    }

    function logic(code){
        //console.log(code);
        if(code.indexOf('=') === 0){
            // case:<%=name; %>
            code = code.replace(/^=|[\s;]*$/g,'');

            code = "$out+=" + code + ";\n";
        }
        //console.log(code);
        each(getVariable(code),function(name){
            if(!name || variableModule[name]){
                return;
            }
            var value;

            value = "$data." + name;
            variableModule[name] = true;

            headerCode += name + "=" + value + ",\n";
        })
        return code;
    }

    // 静态分析模板变量
    var keywords =
    // 关键字
    'break,case,catch,continue,debugger,default,delete,do,else,false'
    + ',finally,for,function,if,in,instanceof,new,null,return,switch,this'
    + ',throw,true,try,typeof,var,void,while,with'

    // 保留字
    + ',abstract,boolean,byte,char,class,const,double,enum,export,extends'
    + ',final,float,goto,implements,import,int,interface,long,native'
    + ',package,private,protected,public,short,static,super,synchronized'
    + ',throws,transient,volatile'

    // ECMA 5 - use strict
    + ',arguments,let,yield'

    + ',undefined';

    // case /* */ , // , "name" , 'name' , .name
    var removePattern = /\/\*[\w\W]*?\*\/|\/\/[^\n]*|"[^"]*"|'[^']*'|\s*\.\s*[$\w\.]+/g;
    // js变量命名规范外的字符
    var notVariablePattern = /[^\w$]+/g;
    // js保留字符
    var keywordPattern = new RegExp("\\b" + keywords.replace(/,/g, '\\b|\\b') + "\\b", 'g');
    // 数字 12.00,  ,12
    var numberPattern = /^\d[^,]*|,\d[^,]*/g;
    // 首尾边界的逗号
    var boundaryPattern = /^,+|,+$/g;
    // 分割字符串 ,或者空行
    var splitPattern = /^$|,+/;


    // 获取变量
    function getVariable (code) {
        return code
        .replace(removePattern, '')
        .replace(notVariablePattern, ',')
        .replace(keywordPattern, '')
        .replace(numberPattern, '')
        .replace(boundaryPattern, '')
        .split(splitPattern);
    };

    function html(code){
        if(defaultConfig.compress){
            //压缩多余的空格和注释
            code = code.replace(/\s+/g, ' ')
            .replace(/<!--[\w\W]*?-->/g,'');
        }
        return "$out+=" + stringify(code) + ";\n";
    }

    // 模板中纯字符串转义
    function stringify(code){
        return "'"
        // 转义单引号和反斜杠
        + code.replace(/'|\\/g, '\\$1')
        // 转义换行符(windows + linux)
        .replace(/\r/g, '\\r')
        .replace(/\n/g, '\\n')
        + "'";
    }

    function each(obj, callback){
        if(isArray(obj)){
            for(var i = 0; i < obj.length; i++){
                callback.call(obj[i],obj[i],i);
            }
        }else{
            for(var i in obj){
                callback.call(obj[i],obj[i],i);
            }
        }
    }

    function isArray(arr){
        return Array.isArray ? Array.isArray : toString.call(arr) === '[object Array]';
    }

    function errorInfo(e){
        return;
        var message = 'Template Error\n\n';

        for(var name in e){
            message += '['+ name +']' + e[name] + '\n\n';
        }

        if( typeof console === 'object' ){
            console.error(message);
        }
    }

    this.template = template;

    
})();
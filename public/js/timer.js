//분으로 시간을 설정하고 
//분을 초로 환산
//시,분,초로 초단위로 갱신해서 보여줌
//0초가 되면 종료 메소드 실행


var setTime;
var time = setTime * 60; //setTime은 사용자 정의

setInterval(() => {
    
    var hour =  Math.floor(time/3600);
    var min = Math.floor(time/60); 
    var sec = time % 60;

    time -= 1;

    //남은 시간 innerHTML로 삽입해서 보여줌
    

    if(hour == 0 && min == 0 && sec == 0){
        //종료 메소드 실행
    }
    
},1000);

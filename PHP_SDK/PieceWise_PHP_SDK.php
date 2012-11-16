<?php
	class apiCalls{
		protected $userAgent = "piecewise-php/1.0";

		const TEST_SERVERS = 0;
	    const PROD_SERVERS = 1;
		function __construct($key, $servers,$username=false, $pass=false) {
			if($pass && $username){
				$this->_key=$key."&username=".$username."&pass=".$pass;	
			}
			else{
				$this->_key = $key;
			}
			switch($servers) {
				case self::PROD_SERVERS:
				$this->url = "https://piecewise.com/";
				break;
				case self::TEST_SERVERS:
				$this->url = "https://developers.piecewise.com/";
				break;
				default:
				return "bad production";
			}
			$this->project=new projects($this->_key,$this->url);
			$this->pieces=new pieces($this->_key,$this->url);
			$this->users=new users($this->_key,$this->url);
		}
		protected function callAPI($method, $params, $data=null, $login=null) {
			$_errors = array();
			$uri = array_shift($params).".php";
			$cleanuri = '';
			$n=0;
			if(count($params)!=0){
				foreach($params as $key=>$param) {
					$uri .=($n==0 ? "?":"&").$key."=".rawurlencode($param);
					$n++;
				}
			}
			$request_url = $this->url.$uri;
			$headers = array();
			$headers[] = 'Content-Type: application/x-www-form-urlencoded';
			$ch = curl_init();
			curl_setopt($ch,CURLOPT_USERAGENT,$this->userAgent);
			curl_setopt($ch, CURLOPT_URL, $request_url);
			curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
			if($method!="FILES"){
				curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
			}
			curl_setopt($ch, CURLINFO_HEADER_OUT, true);
			curl_setopt($ch, CURLOPT_VERBOSE, 1);			
			switch($method) {
				case 'GET':
					$respBody = curl_exec($ch);
					$respInfo = curl_getinfo($ch);
				break;
				case 'POST':
					$post_fields='';
					if(isset($data)){
						$post_fields  = http_build_query($data);
						curl_setopt($ch, CURLOPT_POST, true);
						curl_setopt($ch, CURLOPT_POSTFIELDS, $post_fields);
					}
					else {
						$_errors[] = 'API Call - Warning - No POST data provided for POST request';
					}
					$respBody = curl_exec($ch);
					$respInfo = curl_getinfo($ch);
				break;
				case 'PUT':
					$put_fields = http_build_query($data);
					$reqLen = strlen($put_fields);
					$fh = fopen('php://memory', 'rw');
					fwrite($fh, $put_fields);
					rewind($fh);				
					curl_setopt($ch, CURLOPT_INFILE, $fh);
					curl_setopt($ch, CURLOPT_INFILESIZE, $reqLen);
					curl_setopt($ch, CURLOPT_PUT, true);				
					$respBody = curl_exec($ch);
					$respInfo = curl_getinfo($ch);
				break;
				case 'DELETE':
					$delete_fields  = http_build_query($data);
					curl_setopt($ch, CURLOPT_POSTFIELDS, $delete_fields);
					curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
					$respBody = curl_exec($ch);
					$respInfo = curl_getinfo($ch);
				break;
				case 'FILES':
					if(isset($data)){
						curl_setopt($ch, CURLOPT_POST, true);
						curl_setopt($ch, CURLOPT_POSTFIELDS,$data);
					}
					else {
						$_errors[] = 'API Call - Warning - No POST data provided for POST request';
					}
					$respBody = curl_exec($ch);
					$respInfo = curl_getinfo($ch);
				break;
				default:
			}
			
			if($respInfo['http_code'] > 400) {
				$_errors[] = "API returned an HTTP status of ".$respInfo['http_code'];
				throw new OrdrinExceptionBadValue($_errors);
			}
			curl_close($ch);				
			return $respBody;
		}	
	}
	class pieces extends apiCalls{
		function __construct($key,$url){
			$this->url=$url;
			$this->_key=$key;
			$this->tree=new tree($key,$url);
			$this->assignment=new assignments($key,$url);
			$this->offers=new offers($key,$url);
		}
		public function createPiece($parent,$projectID,$text,$olderSibling="NULL"){
			return $this->callAPI("POST",array("url"=>"createPieceFunction"),array("parent"=>$parent,"project"=>$projectID,"text"=>$text,"olderSibling"=>$olderSibling,"API"=>$this->_key));
		}
		public function deletePiece($pieceID){
			return $this->callAPI("DELETE",array("url"=>"AjaxQueries","QueryNumber"=>1),array("PieceID"=>$pieceID,"API"=>$this->_key));
		}
		public function movePiece($projectID,$pieceID,$parentID,$sibling="NULL"){
			return $this->callAPI("POST",array("url"=>"AjaxQueries","QueryNumber"=>7),array("PieceID"=>$pieceID,"ProjectID"=>$projectID,"SiblingPieceID"=>$sibling,"ParentPieceID"=>$parentID,"API"=>$this->_key));
		}
		public function getProposedEdits($pieceID){
			return $this->callAPI("GET",array("url"=>"AjaxQueries","QueryNumber"=>13,"PieceID"=>$pieceID,"API"=>$this->_key));
		}
		public function editPieceByID($pieceID,$ideaID){
			return $this->callAPI("POST",array("url"=>"AjaxQueries","QueryNumber"=>14),array("PieceID"=>$pieceID,"IdeaID"=>$ideaID,"API"=>$this->_key));
		}
		public function editPiece($pieceID,$ideaDescription){
			return $this->callAPI("POST",array("url"=>"AjaxQueries","QueryNumber"=>15),array("PieceID"=>$pieceID,"IdeaDescription"=>$ideaDescription,"API"=>$this->_key));
		}
		public function getPieceInfo($pieceID){
			return $this->callAPI("GET",array("url"=>"GetPieceInfo","Info"=>1,"PieceID"=>$pieceID,"API"=>$this->_key));
		}
		public function getParentPieceID($pieceID){
			return $this->callAPI("GET",array("url"=>"GetPieceInfo","Info"=>2,"PieceID"=>$pieceID,"API"=>$this->_key));
		}
		public function getSiblingPieceID($pieceID){
			return $this->callAPI("GET",array("url"=>"GetPieceInfo","Info"=>3,"PieceID"=>$pieceID,"API"=>$this->_key));
		}
		public function topProjectPiece($pieceID){
			return $this->callAPI("GET",array("url"=>"GetPieceInfo","Info"=>4,"PieceID"=>$pieceID,"API"=>$this->_key));
		}
		public function getPiecesICreated($start=0){//returns 10 at a time from start by descending
			return $this->callAPI("GET",array("url"=>"SqlApi","ApiFunction"=>1,"Start"=>$start,"API"=>$this->_key));
		}
		public function searchIdeas($searchQuery){
			if(strlen($searchQuery)<3){
				return "Query too short.";
			}
			return $this->callAPI("GET",array("url"=>"getPieces","q"=>$searchQuery,"API"=>$this->_key));
		}
		public function getPiecesByIdeaID($IdeaID){
			return $this->callAPI("GET",array("url"=>"SqlApi","ApiFunction"=>2,"IdeaID"=>$IdeaID,"API"=>$this->_key));
		}
		//split piece
		//get splits
	}
	class projects extends apiCalls{
		function __construct($key,$url){
			$this->url=$url;
			$this->_key=$key;
		}
		public function createProject($projectHeadline,$projectDescription=NULL){
			$IDs=explode(",",$this->callAPI("POST",array("url"=>"CreateOrEditProject"),array("ProjectHeadline"=>$projectHeadline,"API"=>$this->_key)));
			$FirstPieceID=$IDs[0];
			$ProjectID=$IDs[1];
			if($projectDescription!=NULL){
				$this->updateDescription($projectDescription,$ProjectID);
			}
			return json_encode(array("ProjectID"=>$ProjectID,"PieceID"=>$FirstPieceID));
		}
		public function updateDescription($projectDescription,$ProjectID){
			$this->callAPI("POST",array("url"=>"CreateOrEditProject"),array("ProjectDescription"=>$projectDescription,"ProjectID"=>$ProjectID,"API"=>$this->_key));
		}
		public function getMyProjects($limit=10){
			return $this->callAPI("GET",array("url"=>"SqlApi","ApiFunction"=>3,"Limit"=>$limit,"API"=>$this->_key));
		}
		public function getSomeProjects($ProjectIDs){
			return $this->callAPI("GET",array("url"=>"SqlApi","ApiFunction"=>4,"ProjectIDs"=>$ProjectIDs,"API"=>$this->_key));
		}
		public function searchProjects($query){
			if(strlen($query)<3){
				return "Query too short";
			}
			return $this->callAPI("GET",array("url"=>"getProjectHeadlines","q"=>$query,"API"=>$this->_key));
		}
		public function getProjectPieces($projectID){
			return $this->callAPI("GET",array("url"=>"SqlApi","ApiFunction"=>5,"ProjectID"=>$projectID,"API"=>$this->_key));
		}
		//project images
	}
	class tree extends pieces{
		function __construct($key,$url){
			$this->url=$url;
			$this->_key=$key;
		}
		public function getProjectBranch($startID,$maxDepth=5){
			return $this->callAPI("GET",array("url"=>"GetTreeBranchWithData","PieceID"=>$startID,"MaxDepth"=>$maxDepth,"API"=>$this->_key));
		}
	}
	class offers extends pieces{
		function __construct($key,$url){
			$this->url=$url;
			$this->_key=$key;
			$this->images=new images($this->_key,$this->url);
		}
		public function submitOffer($pieceID,$desc,$bidUnit,$time,$timeUnit,$amount,$maxUnits="",$bidImage=NULL){
			$PossibleTimeUnits=array("Minute","Hour","Day","Week","Month");
			$params=array("PieceID"=>$pieceID,"BidDescription"=>$desc,"BidUnit"=>$bidUnit,"CompletionTime"=>$time,"TimeUnit"=>$timeUnit,"BidAmount"=>$amount,"MaxUnits"=>$maxUnits,"API"=>$this->_key);
			if($bidImage){
				$params["BidImage"]=$this->images->uploadImage($bidImage);	
			}
			return $this->callAPI("POST",array("url"=>"AddNewBid"),$params);
		}
		public function getOffers($pieceID){
			return $this->callAPI("GET",array("url"=>"GetBidsApi","PieceID"=>$pieceID,"API"=>$this->_key));
		}
		public function getMyOffers(){
			return $this->callAPI("GET",array("url"=>"GetBidsApi","API"=>$this->_key));
		}
		public function makePurchase($pieceID,$bidID,$quantity,$phone,$email,$address,$message=NULL,$assignmentArray=NULL){
			//dueDate,reminderDate,textReminder,emailReminder,pieceID
			$params=array("Quantity"=>$quantity,"BidID"=>$bidID,"Phone"=>$phone,"Email"=>$email,"Address"=>$address,"API"=>$this->_key);
			if($message){
				$params["Message"]=$message;
			}
			if($assignmentArray){
				array_merge($params,$assignmentArray);
			}
			return $this->callAPI("POST",array("url"=>"AcceptBid"),$params);
		}
		public function updateOffer($bidID,$params){
			if(isset($params["BidImage"])){
				$params["BidImage"]=$this->images->uploadImage($params["BidImage"]);	
			}
			$params["BidID"]=$bidID;
			$params["API"]=$this->_key;
			return $this->callAPI("POST",array("url"=>"UpdateBid"),$params);
		}
		public function closeOffer($bidID){
			return $this->updateOffer($bidID,array("IsOpen"=>0));
		}
		public function openOffer($bidID){
			return $this->updateOffer($bidID,array("IsOpen"=>1));
		}
		//close my offer
	}
	class assignments extends pieces{
		function __construct($key,$url){
			$this->url=$url;
			$this->_key=$key;
		}
		public function createAssignment($pieceID,$assigneeID,$dueDate=NULL,$reminderDate=NULL,$emailReminder=NULL,$textReminder=NULL){
			//dueDate,reminderDate,assigneeID,textReminder,ProjectID,emailReminder
			//formats http://www.php.net/manual/en/datetime.formats.compound.php
			$params=array("pieceID"=>$pieceID,"assigneeID"=>$assigneeID,"API"=>$this->_key);
			if($dueDate){
				$params["dueDate"]=strtotime($dueDate);	
			}
			if($reminderDate){
				$params["reminderDate"]=strtotime($reminderDate);	
			}			
			if($textReminder){
				$params["textReminder"]=$textReminder;	
			}
			if($emailReminder){
				$params["emailReminder"]=$emailReminder;	
			}			
			return $this->callAPI("POST",array("url"=>"processAssignUser"),$params);
		}
		public function getAssignment($pieceID){
			return $this->callAPI("GET",array("url"=>"GetAssignment","PieceID"=>$pieceID,"API"=>$this->_key));
		}
		public function updateAssignment($pieceID,$assigneeID,$dueDate=NULL,$reminderDate=NULL,$emailReminder=NULL,$textReminder=NULL){
			return $this->createAssignment($pieceID,$assigneeID,$dueDate,$reminderDate,$emailReminder,$textReminder);	
		}
	}
	class images extends offers{
		function __construct($key,$url){
			$this->url=$url;
			$this->_key=$key;
		}
		protected function uploadImage($theImage){
			$spot=rand();
			move_uploaded_file($theImage["tmp_name"],$spot);
			$fileID=$this->callAPI("FILES",array("url"=>"UploadFile"),array("API"=>$this->_key,"anImage"=>"@".$spot.";type=".$theImage["type"]));
			unlink($spot);
			return $fileID;
		}
		public function deleteImage($imageID){
			return $this->callAPI("DELETE",array("url"=>"DeleteFile"),array("FileID"=>$imageID,"API"=>$this->_key));	
		}	
	}
	class users extends apiCalls{
		function __construct($key,$url){
			$this->url=$url;
			$this->_key=$key;
		}
		public function createNewUser($username,$email,$password){
			return $this->callAPI("POST",array("url"=>"processSignUpPage"),array("Email"=>$email,"username"=>$username,"password"=>$password,"ApiSignUp"=>1,"API"=>$this->_key));	
		}
		public function setAddress($street1,$city,$state,$zip,$street2=false){
			$params=array("streetAddress"=>$street1,"city"=>$city,"state"=>$state,"zipcode"=>$zip,"API"=>$this->_key);
			if($street2){
				$params["streetAddress2"]=$street2;	
			}
			return $this->callAPI("POST",array("url"=>"UpdateAddress"),$params);	
		}
		public function setPhoneNumber($phoneNumber){
			return $this->callAPI("POST",array("url"=>"UpdatePhoneNumber"),array("PhoneNumber"=>$phoneNumber,"API"=>$this->_key));
		}
		public function setBirthdate($birthday){
			//check format
			return $this->callAPI("POST",array("url"=>"ChangeBirthday"),array("Birthday"=>$birthday,"API"=>$this->_key));				
		}
		public function updateEmail($newEmail,$oldEmail){
			return $this->callAPI("POST",array("url"=>"changeEmail"),array("NoForward"=>1,"newemail"=>$newEmail,"Email"=>$oldEmail,"API"=>$this->_key));						
		}
		public function getEmail(){
			return $this->callAPI("GET",array("url"=>"SqlApi","ApiFunction"=>7,"API"=>$this->_key));
		}
		public function setName($firstN,$lastN){
			return $this->callAPI("POST",array("url"=>"changeNames"),array("FirstName"=>$firstN,"LastName"=>$lastN,"API"=>$this->_key));	
		}
		public function getUserInfo(){
			return $this->callAPI("GET",array("url"=>"SqlApi","ApiFunction"=>6,"API"=>$this->_key));
		}
		public function changeProfPic($theImage){
			$spot=rand();
			move_uploaded_file($theImage["tmp_name"],$spot);
			$fileID=$this->callAPI("FILES",array("url"=>"ChangeProfilePic"),array("API"=>$this->_key,"files"=>"@".$spot.";type=".$theImage["type"]));
			unlink($spot);
			return $fileID;	
		}
		//maybe individual calls for user info
	}
?>
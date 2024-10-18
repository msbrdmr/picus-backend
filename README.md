# Proje Genel Görünümü

Özetle, bu projede AWS ortamımı kurdum, bir DynamoDB tablosu oluşturdum, çeşitli API'leri sunmak için bir Express.js uygulaması geliştirdim ve uygulamayı Docker ve AWS kullanarak deploy ettim. Ayrıca, DynamoDB tablosundaki belirli öğeleri yönetmek için bir Lambda fonksiyonu oluşturdum.

## 1. AWS Hesabı Oluşturma

Bu aşamada yeni bir hesap oluşturmadım; daha önce oluşturmuş olduğum hesabıma root kullanıcı olarak erişim sağladım. Hesabımın ayarlarını kontrol ettim.

## 2. DynamoDB Tablosunun Kurulumu

### Tablo Oluşturma: `employee_info`

- AWS konsolunda DynamoDB bölümüne gittim ve yeni bir tablo oluşturdum.
- Tablo adını `employee_info` olarak belirledim.
- Partition key olarak `employeeid` tanımladım, böylece her çalışan kaydı için benzersiz bir kimlik verisi oluşturmuş oldum.

## 3. Express Uygulamasını Geliştirme

### Express Uygulamasının Kurulumu

1. **Express Uygulamasını Başlattım**: Yeni bir Express.js uygulaması oluşturmak için öncelikle Node.js ve npm'nin sistemimde yüklü olduğundan emin oldum. Terminalde gerekli bağımlılıkları yüklemek için `npm install express body-parser aws-sdk` komutunu çalıştırdım. Bu işlem, uygulamamın çalışması için gerekli olan Express.js ve body-parser gibi kütüphaneleri yükledi. Ayrıca, DynamoDB ile bağlantı sağlamak için AWS SDK'sını (aws-sdk) da kurdum. Geliştirme aşamasında `nodemon` kullandım ve daha sonra `package.json` dosyasına bir dev script ekleyerek uygulamayı o şekilde çalıştırdım.

### API Endpoints

Bu uygulamada belirtilen endpointleri yazdım ve port 3000'de servis edilecek şekilde çalışacak.

- **Tüm Itemleri Al**
  - `GET` yöntemi ile `/picus/list` endpoint'ini oluşturdum. Bu endpoint, `employee_info` tablosundaki tüm çalışan kayıtlarını almak için kullanılıyor.

- **Bir Eleman Ekle**
  - `POST` yöntemi ile `/picus/put` endpoint'ini tanımladım. Bu endpoint, çalışan verilerini içeren bir istek gövdesi alarak yeni bir kayıt ekliyor.

- **Belirli Bir Çalışan Kaydını Al**
  - `GET` yöntemi ile `/picus/get/{key}` endpoint'ini oluşturdum. Bu endpoint, path parametresinden verilen `key` (yani `employeeid`) temelinde belirli bir çalışan kaydını alıyor. 

### Sürüm Kontrolü

- **Bir Repo Oluşturdum**: Sürüm kontrolü ve ileriki aşamalarda kuracağım CI/CD süreci için Git kullandım. Uygulamayı kurduktan ve çalıştırdıktan sonra 'initial commit' mesajıyla ilk commit'imi attım ve GitHub'a publish ettim.

## 4. Uygulamayı Docker ile Paketleme

- **Dockerfile Oluşturdum**: Express uygulamamı çalıştırmak için bir Dockerfile oluşturdum. Bu Dockerfile, uygulamamın bir Docker image'ına dönüştürülebilmesi için gerekli ayarları içeriyor. Node ortamının kurulması, port binding ve projenin ayağa kaldırılması için gerekli komutları içeriyor.

## 5. Uygulamayı AWS Üzerinde Dağıtma

### Ön Koşullar

- **AWS CLI'yi Kurdum**: AWS CLI'nin yüklü olduğunu kontrol ettim ve ECR ile ECS için gerekli izinlere sahip bir IAM kullanıcısı yapılandırdım.

### Dağıtım Adımları

1. **ECR**: Docker imajımı oluşturduktan sonra, bunu Amazon Elastic Container Registry (ECR)'ye gönderdim. Burası, DockerHub gibi çalışan ve container'larımızı deploy edebileceğimiz bir ortam.
2. **Task Definition Oluşturdum**: ECS'de bir task definition oluşturdum. Bu tanım, ECR'dan gelen Docker imajını, kaynak spesifikasyonlarını (CPU, RAM, GPU) ve ortam değişkenlerini içeriyor. Bunları verdikten sonra ayrıca uygulamamın çalıştığı porta göre mapping'leri ayarladım ve Task execution role olarak aşağıdaki izinleri içerecek bir execution role oluşturup kullandım:
   - AmazonECSTaskExecutionRolePolicy
   - AmazonPollyReadOnlyAccess
   - AmazonSSMReadOnlyAccess
   - CloudWatchLogsFullAccess

3. **ECS Cluster'ı Oluşturdum**: Bir ECS kümesi oluşturdum. İki seçenek arasından AWS Fargate'yi seçerek sunucusuz bir ortamda dağıtım yapmaya karar verdim. ECS'i Docker imajına bağlayarak bir task vasıtasıyla onu çalıştırmasını sağladım.

4. **Service Oluşturma**: Oluşturduğum Task definition'u, ECS kümesinde bir service olarak dağıttım ve talebe göre ölçeklenmesini sağladım.

5. **Ağ Yapılandırması**: Servis için bir VPC ve security group oluşturdum. Gerekli trafiği izin vermek için inbound kurallarını düzenledim.

## 7. Lambda Fonksiyonunu Oluşturma

### IAM Rollerini ve Politika Ayarlarını Yapılandırma

- Lambda fonksiyonunun DynamoDB tablosuna okuma/yazma işlemleri için tam erişim sağladığından emin olmak için AWS IAM rollerini ve politikalarını ayarladım. Bu aşamada, lambda fonksiyonuna execution role olarak DynamoDB izinlerini verdim. Ayrıca, lambda fonksiyonum gelen API Gateway trafiklerini ECS'e yönlendirecek şekilde Python kullanarak kodunu yazdım.

### API Gateway Kurulumu

- **Endpointler Tanımlama**: Çalışan kayıtlarını yönetmek için bir API Gateway endpoint'i oluşturdum ve path parametrelerini ayarladım. Burada, hem ECS üzerinde çalışan Docker container'ım hem de Lambda fonksiyonundaki endpoint'imi tek bir API Gateway'e bağlayarak, tek bir domain üzerinden isteklerin dağıtılıp işlenmesini sağladım.

### Lambda Fonksiyonunu Yazma

- **Endpoint**: `DELETE /picus/{key}` oluşturup işlevselliğini sağladım. Bu fonksiyon, sağlanan `key` temelinde DynamoDB tablosundaki belirli bir çalışan kaydını silmektedir. Ayrıca içeride iki GET ve bir POST metodu, gelen istekleri ECS'e yönlendirmektedir.

## Github Actions ile CI/CD Kurulumu

---

## Sonuç

Bu proje, AWS üzerinde bir uygulama mimarisinin kurulumu ile ilgili adımları kapsıyor. DynamoDB, veri depolama için, Express.js uygulaması API etkileşimleri için ve AWS hizmetleri dağıtım ve yönetim için kullanılıyor. Belirtilen adımları izleyerek AWS ortamımda bu kurulumu gerçekleştirdim.

Deploy edilen backend URL'si: https://kjcqtmkzy1.execute-api.eu-central-1.amazonaws.com/prod/

# Proje Genel Görünümü

Özetle, bu projede AWS ortamımı kurdum, bir DynamoDB tablosu oluşturdum, çeşitli API'leri sunmak için bir Express.js uygulaması geliştirdim ve uygulamayı Docker ve AWS kullanarak deploy ettim. Ayrıca, DynamoDB tablosundaki belirli öğeleri yönetmek için bir Lambda fonksiyonu oluşturdum.

## 1. AWS Hesabı Oluşturma

Bu aşamada yeni bir hesap oluşturmadım; daha önce oluşturmuş olduğum hesabıma root kullanıcı olarak erişim sağladım ve daha sonraki islemler icin bu root hesabi icinde IAM kullanicilari olusturdum. 

## 2. DynamoDB Tablosunun Kurulumu

### Tablo Oluşturma: `employee_info`

- AWS konsolunda DynamoDB bölümüne gittim ve yeni bir tablo oluşturdum.
- Tablo adını `employee_info` olarak belirledim.
- Partition key olarak `employeeid` tanımladım, böylece her çalışan kaydı için benzersiz bir kimlik verisi oluşturmuş oldum.

## 3. Express Uygulamasını Geliştirme

### Express Uygulamasının Kurulumu

1. **Express Uygulaması**: Bu asamada bir Express Node.js uygulamasi yapmaya karar verdim. Terminalde gerekli bağımlılıkları yüklemek için `npm install express body-parser aws-sdk` komutunu çalıştırdım. Bu işlem, uygulamamın çalışması için gerekli olan Express.js ve body-parser gibi kütüphaneleri yükledi. Ayrıca, DynamoDB ile bağlantı sağlamak için AWS SDK'sını (aws-sdk) da kurdum. Geliştirme aşamasında `nodemon` kullandım ve daha sonra `package.json` dosyasına bir dev script ekleyerek uygulamayı o şekilde çalıştırdım.

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

## 4. Uygulamayı Dockerize Etme

- **Dockerfile Oluşturdum**: Express uygulamamı çalıştırmak için bir Dockerfile oluşturdum. Bu Dockerfile, uygulamamın bir Docker image'ına dönüştürülebilmesi için gerekli ayarları içeriyor. Node ortamının kurulması, port binding ve projenin ayağa kaldırılması için gerekli komutları içeriyor.
FROM node:14  > Bu satır, Docker imajının temelini belirler. Node.js'in 14. sürümünü kullandığımızı gösteriyor; bu da uygulamanın bu Node sürümünde çalışacağı anlamına geliyor.
WORKDIR /usr/src/app  > Çalışma dizinini ayarlıyoruz. Uygulama dosyalarının yer alacağı dizini `/usr/src/app` olarak belirliyoruz; bu, sonraki komutların bu dizin içinde çalışmasını sağlar.
COPY package*.json ./  > `package.json` ve `package-lock.json` dosyalarını çalışma dizinine kopyalıyoruz. Bu dosyalar, uygulamanın bağımlılıklarını içeriyor ve bu nedenle bu adım önemli.
RUN npm install  > Kopyalanan `package.json` dosyalarındaki bağımlılıkları yüklemek için `npm install` komutunu çalıştırıyoruz. Bu, uygulamanın düzgün çalışabilmesi için gereken tüm paketleri indirir.
COPY . .  > Uygulamanın geri kalan dosyalarını (kodu, statik dosyaları, vb.) çalışma dizinine kopyalıyoruz. Böylece tüm uygulama dosyaları kapsayıcı içinde bulunmuş oluyor.
EXPOSE 3000  > Uygulamanın dinleyeceği portu açıyoruz. Uygulama 3000 portu üzerinden erişilebilir olacak, bu sayede dış dünyadan gelen istekleri karşılayabiliriz.
CMD [ "node", "app.js" ]  > Uygulama başlatma komutunu belirliyoruz. `node app.js` komutu, `app.js` dosyasını çalıştırarak uygulamanın başlatılmasını sağlıyor.

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

- Lambda fonksiyonunun DynamoDB tablosuna okuma/yazma işlemleri için tam erişim sağladığından emin olmak için AWS IAM rollerini ve politikalarını ayarladım. Bu aşamada, lambda fonksiyonuna execution role olarak DynamoDB izinlerini verdim. Ayrıca, lambda fonksiyonum gelen API Gateway trafiklerini ECS'e yönlendirecek şekilde Python kodunu yazdım.

### API Gateway Kurulumu

- **Endpoint Tanımlama**: DynamoDb Tablomdaki Employee kayıtlarını yönetmek için bir API Gateway endpoint'i oluşturdum ve path parametrelerini ayarladım. Burada, hem ECS üzerinde çalışan Docker container'ım hem de Lambda fonksiyonundaki endpoint'imi tek bir API Gateway'e bağlayarak, tek bir domain üzerinden isteklerin dağıtılıp işlenmesini sağladım.

### Lambda Fonksiyonunu Yazma

- **Endpoint**: `DELETE /picus/{key}` oluşturup işlevselliğini sağladım. Bu fonksiyon, sağlanan `key` temelinde DynamoDB tablosundaki belirli bir çalışan kaydını silmektedir. Ayrıca içeride iki GET ve bir POST metodu, gelen istekleri ECS'e yönlendirmektedir.

## Github Actions ile CI/CD Kurulumu

Projenin .github/workflows dizinine ir YAML dosyası ekledim ve GitHub Actions ile AWS ECS üzerinde uygulamamı dağıtmak için CI/CD sürecimi otomatikleştirdim. Dosya, master dalında bir değişiklik olduğunda otomatik olarak tetiklenecek şekilde ayarlandı. env bölümünde, AWS ile ilgili kritik bilgileri ve ECR (Elastic Container Registry) için gizli değişkenleri tanımladım. Bu gizli değişkenler, güvenlik açısından GitHub'ın secrets sisteminden alınıyor, böylece şifrelerim kodumda görünmüyor. İş akışımda deploy adında bir görev oluşturdum. İlk olarak, kodumun kontrol edilmesi için checkout işlemi yapılıyor. Ardından, AWS kimlik bilgilerimi yapılandırmak için bir adım ekledim. Bu adımda, erişim anahtarı ve gizli anahtarı kullanarak AWS ile bağlantı kuruyorum. Sonrasında, Amazon ECR'ye giriş yapıyorum ve Docker imajımı oluşturup etiketleyip itiyorum.

En son olarak, oluşturduğum imajı kullanarak ECS görev tanımını güncelliyorum ve güncellenmiş görev tanımını AWS ECS'ye dağıtıyorum. Böylece, uygulamam her güncelleme yapıldığında otomatik olarak AWS üzerinde güncelleniyor. Bu sayede süreçlerimi daha verimli bir şekilde yönetebiliyorum.

---

## Sonuç

Bu proje, AWS üzerinde bir uygulama mimarisinin kurulumu ile ilgili adımları kapsıyor. DynamoDB, veri depolama için, Express.js uygulaması API etkileşimleri için ve AWS hizmetleri dağıtım ve yönetim için kullanılıyor. Belirtilen adımları izleyerek AWS ortamımda bu kurulumu gerçekleştirdim.

Deploy edilen backend URL'si: https://kjcqtmkzy1.execute-api.eu-central-1.amazonaws.com/prod/

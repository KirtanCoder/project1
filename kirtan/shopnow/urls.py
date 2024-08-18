from django.contrib import admin
from django.urls import path,include
from shopnow import views
from shopnow.models import Contact

urlpatterns = [
    path('', views.index,name="shopnow"),
    path('contact', views.contact, name="contact"),
    path('login', views.loginUser, name="login"),
    path('logout', views.logoutUser, name= "logout"),
    path('about',views.about, name="about"),
    path('services',views.services, name="services"),
    

]
